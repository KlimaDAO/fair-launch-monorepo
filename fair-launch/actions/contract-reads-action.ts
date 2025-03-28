'use server';

import { readContracts } from "@wagmi/core";
import { abi as erc20Abi } from "@abi/erc20";
import { abi as klimaFairLaunchAbi } from "@abi/klima-fair-launch";
import { FAIR_LAUNCH_CONTRACT_ADDRESS, KLIMA_V0_TOKEN_ADDRESS } from "@utils/constants";
import { config } from "@utils/wagmi.server";
import { unstable_cacheLife as cacheLife } from 'next/cache';
import { AbiFunction } from "viem";

export const getContractConstants = async (walletAddress: string) => {
  'use cache';

  // these values should be set for a long time in the cache...
  cacheLife({ stale: 120, revalidate: 60, expire: 900 });

  try {
    return await readContracts(config, {
      contracts: [
        {
          abi: klimaFairLaunchAbi as AbiFunction[],
          address: FAIR_LAUNCH_CONTRACT_ADDRESS,
          functionName: "burnRatio", // how often does this change?
        },
        {
          abi: erc20Abi as AbiFunction[],
          address: KLIMA_V0_TOKEN_ADDRESS,
          functionName: "totalSupply", // shouldn't change
        },
        {
          abi: klimaFairLaunchAbi as AbiFunction[],
          address: FAIR_LAUNCH_CONTRACT_ADDRESS,
          functionName: "getTotalPoints", // how often does this change?
        },
        {
          abi: klimaFairLaunchAbi as AbiFunction[],
          address: FAIR_LAUNCH_CONTRACT_ADDRESS,
          functionName: "GROWTH_RATE", // shouldnt' change
        },
        {
          abi: klimaFairLaunchAbi as AbiFunction[],
          address: FAIR_LAUNCH_CONTRACT_ADDRESS,
          functionName: "previewUserPoints", // frequently
          args: [walletAddress],
        },
      ],
    });
  } catch (error) {
    console.log('error', error);
  }
};