'use server';

import { readContract } from "@wagmi/core";
import { abi as klimaFairLaunchAbi } from "@abi/klima-fair-launch";
import { FAIR_LAUNCH_CONTRACT_ADDRESS } from "@utils/constants";
import { fetchLeaderboard } from "@utils/queries";
import { config } from "@utils/wagmi.server";
import { unstable_cacheLife as cacheLife } from 'next/cache';

// @todo - move to an action that can be called across the app
// @note - this is only a temp solution, we don't have all the
// available information from the subgraph in order to calculate
// the true leaderboard points. Alternatively, if that information
// is unavailable, we might use trigger.dev to fetch the points
// in a background process periodically, cache the results and
// update every x minutes.
export const calculateLeaderboardPoints = async (limit = 10000) => {
  'use cache';

  cacheLife({
    stale: 120,
    revalidate: 60,
    expire: 900,
  })

  const results = [];
  // change this to fetch all?
  const leaderboard = await fetchLeaderboard(limit);

  for (const wallet of leaderboard.wallets || []) {
    try {
      // const userStakes = await readContract(config, {
      //   args: [wallet.id],
      //   abi: klimaFairLaunchAbi,
      //   address: FAIR_LAUNCH_CONTRACT_ADDRESS,
      //   functionName: "userStakes",
      // });


      // console.log('userStakes', userStakes?.map((userStake: any) => {
      //   console.log('userStake', userStake);
      // }));
      const points = await readContract(config, {
        args: [wallet.id],
        abi: klimaFairLaunchAbi,
        address: FAIR_LAUNCH_CONTRACT_ADDRESS,
        functionName: "previewUserPoints",
      });
      results.push({ ...wallet, totalPoints: points });
    } catch (error) {
      console.error(`Error fetching points for ${wallet.id}:`, error);
      results.push({ ...wallet, totalPoints: null }); // Handle error gracefully
    }
  }
  return results.sort((a, b) => Number(b.totalPoints) - Number(a.totalPoints));
};