import { fetchLeaderboard } from '@utils/queries';
import { NextResponse } from 'next/server';
import { readContract } from '@wagmi/core';
import { abi as klimaFairLaunchAbi } from '@abi/klima-fair-launch';
import { FAIR_LAUNCH_CONTRACT_ADDRESS } from '@utils/constants';
import { omit } from 'lodash';
import { config } from '@utils/wagmi.server';
import { formatUnits } from 'viem';

const calculateLeaderboard = async () => {
  const results = [];
  const leaderboard = await fetchLeaderboard(1000);
  for (const wallet of leaderboard.wallets || []) {
    try {
      const userStakesInfo = await Promise.all(
        (wallet?.stakes || []).map(async (_, index) => {
          const [amount] = await readContract(config, {
            abi: klimaFairLaunchAbi,
            address: FAIR_LAUNCH_CONTRACT_ADDRESS,
            functionName: "userStakes",
            args: [wallet.id, index],
          }) as bigint[];
          return amount;
        }));

      const totalStaked = userStakesInfo.reduce((acc, curr) => acc + Number(curr), 0);

      const points = await readContract(config, {
        args: [wallet.id],
        abi: klimaFairLaunchAbi,
        address: FAIR_LAUNCH_CONTRACT_ADDRESS,
        functionName: "previewUserPoints",
      });

      results.push({
        ...omit(wallet, 'stakes'),
        totalStaked,
        totalPoints: Number(formatUnits(points as bigint, 18))
      });
    } catch (error) {
      console.error(`Error fetching points for ${wallet.id}:`, error);
      results.push({ ...omit(wallet, 'stakes'), totalPoints: null }); // Handle error gracefully
    }
  }
  return results.sort((a, b) => Number(b.totalPoints) - Number(a.totalPoints));
};

export async function GET() {
  const leaderboardData = await calculateLeaderboard();
  const response = NextResponse.json(leaderboardData);
  response.headers.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=1800');
  return response;
}