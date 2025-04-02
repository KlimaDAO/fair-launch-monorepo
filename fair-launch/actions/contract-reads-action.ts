'use server';

import { readContracts } from "@wagmi/core";
import { abi as erc20Abi } from "@abi/erc20";
import { abi as klimaFairLaunchAbi } from "@abi/klima-fair-launch";
import { FAIR_LAUNCH_CONTRACT_ADDRESS, KLIMA_V0_TOKEN_ADDRESS } from "@utils/constants";
import { config } from "@utils/wagmi.server";
import { AbiFunction } from "viem";

export const getContractConstants = async (walletAddress: string) => {
  try {
    return await readContracts(config, {
      contracts: [
        {
          abi: klimaFairLaunchAbi as AbiFunction[],
          address: FAIR_LAUNCH_CONTRACT_ADDRESS,
          functionName: "preStakingWindow",
        },
        {
          abi: klimaFairLaunchAbi as AbiFunction[],
          address: FAIR_LAUNCH_CONTRACT_ADDRESS,
          functionName: "startTimestamp",
        },
        {
          abi: klimaFairLaunchAbi as AbiFunction[],
          address: FAIR_LAUNCH_CONTRACT_ADDRESS,
          functionName: "burnRatio",
        },
        {
          abi: erc20Abi as AbiFunction[],
          address: KLIMA_V0_TOKEN_ADDRESS,
          functionName: "totalSupply",
        },
        {
          abi: klimaFairLaunchAbi as AbiFunction[],
          address: FAIR_LAUNCH_CONTRACT_ADDRESS,
          functionName: "getTotalPoints",
        },
        {
          abi: klimaFairLaunchAbi as AbiFunction[],
          address: FAIR_LAUNCH_CONTRACT_ADDRESS,
          functionName: "EXP_GROWTH_RATE",
        },
        {
          abi: klimaFairLaunchAbi as AbiFunction[],
          address: FAIR_LAUNCH_CONTRACT_ADDRESS,
          functionName: "previewUserPoints",
          args: [walletAddress],
        },
        {
          abi: klimaFairLaunchAbi as AbiFunction[],
          address: FAIR_LAUNCH_CONTRACT_ADDRESS,
          functionName: "getUserStakeCount",
          args: [walletAddress],
        },
        {
          abi: klimaFairLaunchAbi as AbiFunction[],
          address: FAIR_LAUNCH_CONTRACT_ADDRESS,
          functionName: "BURN_DISTRIBUTION_PRECISION",
        },
        {
          abi: klimaFairLaunchAbi as AbiFunction[],
          address: FAIR_LAUNCH_CONTRACT_ADDRESS,
          functionName: "POINTS_SCALE_DENOMINATOR",
        }
      ],
    });
  } catch (error) {
    console.error('error', error);
  }
};