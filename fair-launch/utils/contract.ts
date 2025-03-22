import { readContract } from "@wagmi/core";
import { config } from "@utils/wagmi.server";
import { abi as klimaFairLaunchAbi } from "@abi/klima-fair-launch";
import { FAIR_LAUNCH_CONTRACT_ADDRESS } from "./constants";
import { formatTokenToValue } from "./formatting";

export const calculateBurnFn = async (amount: bigint, timestamp: string) => {
  return await readContract(config, {
    abi: klimaFairLaunchAbi,
    address: FAIR_LAUNCH_CONTRACT_ADDRESS,
    functionName: "calculateBurn",
    args: [amount, timestamp],
  }) as bigint;
};

const calculatePenaltyPercentage = (part: number, total: number) =>
  (part / total) * 100;

export const calculateUnstakePenalty = async (stakeAmount: string | bigint, stakeTimestamp: string) => {
  const burnAmount = formatTokenToValue(await calculateBurnFn(BigInt(stakeAmount), stakeTimestamp));
  const stakeAmountFormatted = formatTokenToValue(stakeAmount);
  const penaltyPercentage = calculatePenaltyPercentage(Number(burnAmount), Number(stakeAmountFormatted));
  return { burnValue: `${burnAmount}`, percentage: `${penaltyPercentage}%` };
}

// @note - this is currently incorrect, but it's a placeholder for now
export const calculateUserPoints = (growthRate: string, stakeAmount: number, multiplier = 0, stakeTimestamp = 3) => {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const elapsedTime = currentTimestamp - stakeTimestamp;
  return BigInt((Number(stakeAmount) * multiplier * elapsedTime * Number(growthRate)) / 100000);
}

export const totalUserStakes = (stakes: { amount: string }[]): number =>
  stakes.reduce((total, stake) => total + parseFloat(stake.amount), 0);