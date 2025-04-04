import { abi as klimaFairLaunchAbi } from "@abi/klima-fair-launch";
import { getConfig } from "@utils/constants";
import { fetchLeaderboard } from "@utils/queries";
import { config as wagmiConfig } from "@utils/wagmi.server";
import { readContract } from "@wagmi/core";
import { omit } from "lodash";
import { NextResponse } from "next/server";
import { formatUnits } from "viem";

// @todo - fix types
const readContractWithRetry = async (config: any, options: any, retries = 2) => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await readContract(config, options);
    } catch (error) {
      if (attempt === retries - 1) throw error;
      console.warn(`Retrying readContract... Attempt ${attempt + 1}`);
    }
  }
};

const calculateLeaderboard = async () => {
  const results = [];
  const config = getConfig();
  const leaderboard = await fetchLeaderboard(1000);
  for (const wallet of leaderboard.wallets || []) {
    try {
      const userStakesInfo = await Promise.all(
        (wallet?.stakes || []).map(async (_, index) => {
          const [amount] = (await readContractWithRetry(wagmiConfig, {
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

      const points = await readContractWithRetry(wagmiConfig, {
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
    .sort((a, b) => Number(b.totalPoints) - Number(a.totalPoints))
    .slice(0, 150);
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
