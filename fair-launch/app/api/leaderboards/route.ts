import { abi as klimaFairLaunchAbi } from "@abi/klima-fair-launch";
import { getConfig } from "@utils/constants";
import { fetchLeaderboard } from "@utils/queries";
import { config as wagmiConfig } from "@utils/wagmi.server";
import { readContracts } from "@wagmi/core";
import { omit } from "lodash";
import { NextResponse } from "next/server";
import { AbiFunction, formatUnits } from "viem";

const calculateLeaderboard = async () => {
  const results: any[] = [];
  const config = getConfig();
  const leaderboard = await fetchLeaderboard(1000);

  const allPoints = await readContracts(wagmiConfig, {
    contracts: leaderboard?.wallets?.map((wallet) => ({
      args: [wallet.id],
      abi: klimaFairLaunchAbi as AbiFunction[],
      address: config.fairLaunchContractAddress,
      functionName: "previewUserPoints",
    })) || [],
  });
  const allPointsArray = allPoints.flatMap(({ result }) => ({ points: result }));

  await Promise.all((leaderboard?.wallets || []).map(async (wallet, index) => {
    try {
      const userStakesLength = new Array(Number(wallet.stakes.length)).fill("");
      const userStakesData = await readContracts(wagmiConfig, {
        contracts: userStakesLength.map((_, index) => ({
          abi: klimaFairLaunchAbi as AbiFunction[],
          address: config.fairLaunchContractAddress,
          functionName: "userStakes",
          args: [wallet.id, index],
        })),
      });
      const userStakes = userStakesData
        .flatMap(({ result }: any) => result?.[0] ?? 0);

      const totalStaked = userStakes.reduce(
        (acc, curr) => acc + Number(curr),
        0
      );

      results.push({
        ...omit(wallet, "stakes"),
        totalStaked,
        totalPoints: Number(formatUnits(allPointsArray[index].points as any, 18)),
      });
    } catch (error) {
      console.error(`Error fetching points for ${wallet.id}:`, error);
        results.push({ ...omit(wallet, "stakes"), totalPoints: null });
      }
    })
  );

  return results
    .sort((a, b) => Number(b.totalPoints) - Number(a.totalPoints))
    .slice(0, 150);
};

export async function GET() {
  const leaderboardData = await calculateLeaderboard();
  const response = NextResponse.json(leaderboardData);
  response.headers.set(
    "Cache-Control",
    "public, max-age=100, stale-while-revalidate=1800"
  );
  return response;
}
