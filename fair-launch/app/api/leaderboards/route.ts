import { abi as klimaFairLaunchAbi } from "@abi/klima-fair-launch";
import { getConfig } from "@utils/constants";
import { fetchLeaderboard } from "@utils/queries";
import { config as wagmiConfig } from "@utils/wagmi.server";
import { readContract } from "@wagmi/core";
import { omit } from "lodash";
import { NextResponse } from "next/server";
import { formatUnits } from "viem";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const calculateLeaderboard = async () => {
  const results = [];
  const config = getConfig();
  const leaderboard = await fetchLeaderboard(1000);
  for (const wallet of leaderboard.wallets || []) {
    try {
      const userStakesInfo = await Promise.all(
        (wallet?.stakes || []).map(async (_, index) => {
          await delay(8); // Delay to respect the 125 requests per second limit
          const [amount] = (await readContract(wagmiConfig, {
            abi: klimaFairLaunchAbi,
            address: config.fairLaunchContractAddress,
            functionName: "userStakes",
            args: [wallet.id, index],
          })) as bigint[];
          return amount;
        })
      );

      const totalStaked = userStakesInfo.reduce(
        (acc, curr) => acc + Number(curr),
        0
      );

      await delay(8); // Delay to respect the 125 requests per second limit
      const points = await readContract(wagmiConfig, {
        args: [wallet.id],
        abi: klimaFairLaunchAbi,
        address: config.fairLaunchContractAddress,
        functionName: "previewUserPoints",
      });

      results.push({
        ...omit(wallet, "stakes"),
        totalStaked,
        totalPoints: Number(formatUnits(points as bigint, 18)),
      });
    } catch (error) {
      console.error(`Error fetching points for ${wallet.id}:`, error);
      results.push({ ...omit(wallet, "stakes"), totalPoints: null });
    }
  }
  return results
    .sort((a, b) => Number(b.totalPoints) - Number(a.totalPoints));
};

export async function GET() {
  const leaderboardData = await calculateLeaderboard();
  const response = NextResponse.json(leaderboardData);
  response.headers.set(
    "Cache-Control",
    "public, max-age=600, stale-while-revalidate=1800"
  );
  return response;
}