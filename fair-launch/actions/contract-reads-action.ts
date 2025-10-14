"use server";

import { abi as klimaFairLaunchAbi } from "@abi/klima-fair-launch";
import { abi as klimaFairLaunchClaimAbi } from "@abi/klima-fair-launch-claim";
import { getConfig } from "@utils/constants";
import { config as wagmiConfig } from "@utils/wagmi.server";
import { readContracts } from "@wagmi/core";
import { AbiFunction } from "viem";

export const getContractConstants = async (walletAddress: string) => {
  const config = getConfig();
  try {
    return await readContracts(wagmiConfig, {
      contracts: [
        {
          abi: klimaFairLaunchAbi as AbiFunction[],
          address: config.fairLaunchContractAddress,
          functionName: "preStakingWindow",
        },
        {
          abi: klimaFairLaunchAbi as AbiFunction[],
          address: config.fairLaunchContractAddress,
          functionName: "startTimestamp",
        },
        {
          abi: klimaFairLaunchAbi as AbiFunction[],
          address: config.fairLaunchContractAddress,
          functionName: "burnRatio",
        },
        {
          abi: klimaFairLaunchAbi as AbiFunction[],
          address: config.fairLaunchContractAddress,
          functionName: "getTotalPoints",
        },
        {
          abi: klimaFairLaunchAbi as AbiFunction[],
          address: config.fairLaunchContractAddress,
          functionName: "EXP_GROWTH_RATE",
        },
        {
          abi: klimaFairLaunchAbi as AbiFunction[],
          address: config.fairLaunchContractAddress,
          functionName: "previewUserPoints",
          args: [walletAddress],
        },
        {
          abi: klimaFairLaunchAbi as AbiFunction[],
          address: config.fairLaunchContractAddress,
          functionName: "getUserStakeCount",
          args: [walletAddress],
        },
        {
          abi: klimaFairLaunchAbi as AbiFunction[],
          address: config.fairLaunchContractAddress,
          functionName: "BURN_DISTRIBUTION_PRECISION",
        },
        {
          abi: klimaFairLaunchAbi as AbiFunction[],
          address: config.fairLaunchContractAddress,
          functionName: "POINTS_SCALE_DENOMINATOR",
        },
        {
          abi: klimaFairLaunchAbi as AbiFunction[],
          address: config.fairLaunchContractAddress,
          functionName: "freezeTimestamp",
        },
        {
          abi: klimaFairLaunchClaimAbi as AbiFunction[],
          address: config.fairLaunchClaimContractAddress,
          functionName: "getKVCMClaimStartTime",
        },
        {
          abi: klimaFairLaunchClaimAbi as AbiFunction[],
          address: config.fairLaunchClaimContractAddress,
          functionName: "getUserClaimableAmount",
          args: [walletAddress],
        },
        {
          // @TODO - replace before merging
          abi: klimaFairLaunchClaimAbi as AbiFunction[],
          address: config.mockFairLaunchClaimContractAddress,
          functionName: "hasUserClaimed",
          args: [walletAddress],
        }
        // {
        //   abi: klimaFairLaunchClaimAbi as AbiFunction[],
        //   address: config.fairLaunchClaimContractAddress,
        //   functionName: "hasUserClaimed",
        //   args: [walletAddress],
        // },
      ],
    });
  } catch (error) {
    console.error("error", error);
  }
};
