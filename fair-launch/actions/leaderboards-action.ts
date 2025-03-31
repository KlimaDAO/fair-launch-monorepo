'use server';

import { readContract, readContracts } from "@wagmi/core";
import { abi as klimaFairLaunchAbi } from "@abi/klima-fair-launch";
import { FAIR_LAUNCH_CONTRACT_ADDRESS } from "@utils/constants";
import { fetchLeaderboard, fetchUserStakes } from "@utils/queries";
import { config } from "@utils/wagmi.server";
import { unstable_cacheLife as cacheLife } from 'next/cache';
import { AbiFunction } from "viem";

// @todo - move to an action that can be called across the app
// @note - this is only a temp solution, we don't have all the
// available information from the subgraph in order to calculate
// the true leaderboard points. Alternatively, if that information
// is unavailable, we might use trigger.dev to fetch the points
// in a background process periodically, cache the results and
// update every x minutes.
export const calculateLeaderboardPoints = async (limit = 10000) => {
  // 'use cache';

  // cacheLife({
  //   stale: 120,
  //   revalidate: 60,
  //   expire: 900,
  // })

  // trigger.dev cron job here???
  // return from cache by default...
  // cache for 2 minutes??
  // whenever trigger.dev updates cache, revalidate the route with the data...

  const results = [];
  const leaderboard = await fetchLeaderboard(limit);

  for (const wallet of leaderboard.wallets || []) {
    try {
      const { stakes } = await fetchUserStakes(wallet.id);

      const stakesContracts = (stakes || []).map((_, index) => ({
        abi: klimaFairLaunchAbi as AbiFunction[],
        address: FAIR_LAUNCH_CONTRACT_ADDRESS as `0x${string}`,
        functionName: "userStakes",
        args: [wallet.id, index],
      }));

      // const userStakesInfoPromise = await readContracts(config, {
      //   contracts: [
      //     {
      //       abi: klimaFairLaunchAbi as AbiFunction[],
      //       address: FAIR_LAUNCH_CONTRACT_ADDRESS as `0x${string}`,
      //       functionName: "previewUserPoints",
      //       args: [wallet.id],
      //     },
      //     ...stakesContracts,
      //   ],
      // }).then((result) => {
      //   // console.log('result', result);
      //   // return result?.[0] || 0;
      // });

      // console.log('userStakesInfoPromise', await Promise.all(userStakesInfoPromise));


      // cache this info also? This data will only change if
      // the user stakes or unstakes, so it should be cached
      const userStakesInfo = await Promise.all(
        (stakes || []).map(async (stake, index) => {
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
      results.push({ ...wallet, totalStaked, totalPoints: points });
    } catch (error) {
      console.error(`Error fetching points for ${wallet.id}:`, error);
      results.push({ ...wallet, totalPoints: null }); // Handle error gracefully
    }
  }
  return results.sort((a, b) => Number(b.totalPoints) - Number(a.totalPoints));
};