import { abi as klimaFairLaunchAbi } from "@abi/klima-fair-launch";
import { config } from "@utils/wagmi.server";
import { readContract } from "@wagmi/core";
import { FAIR_LAUNCH_CONTRACT_ADDRESS } from "./constants";
import { formatNumber, formatTokenToValue } from "./formatting";

export const calculateBurnFn = async (amount: bigint, timestamp: string) => {
  return (await readContract(config, {
    abi: klimaFairLaunchAbi,
    address: FAIR_LAUNCH_CONTRACT_ADDRESS,
    functionName: "calculateBurn",
    args: [amount, timestamp],
  })) as bigint;
};

export const getKlimaXSupply = async () => {
  try {
    return (await readContract(config, {
      abi: klimaFairLaunchAbi,
      address: FAIR_LAUNCH_CONTRACT_ADDRESS,
      functionName: "KLIMAX_SUPPLY",
    })) as bigint;
  } catch (error) {
    console.error("Error getting KlimaX supply", error);
    return 0;
  }
};

const calculatePenaltyPercentage = (part: number, total: number) =>
  (part / total) * 100;

export const calculateUnstakePenalty = async (
  stakeAmount: string | bigint,
  stakeTimestamp: string
) => {
  const burnAmount = formatTokenToValue(
    await calculateBurnFn(BigInt(stakeAmount), stakeTimestamp)
  );
  const stakeAmountFormatted = formatTokenToValue(stakeAmount);
  const penaltyPercentage = calculatePenaltyPercentage(
    Number(burnAmount),
    Number(stakeAmountFormatted)
  );
  return {
    burnValue: `${burnAmount}`,
    percentage: `${formatNumber(penaltyPercentage, 2)}%`,
  };
};

export const totalUserStakes = (stakes: { amount: bigint }[]): bigint =>
  stakes.reduce(
    (total, stake) => BigInt(total) + BigInt(stake.amount),
    BigInt(0)
  );

export const calculateTokenPercentage = (tokens: number, totalSupply: number) =>
  (tokens / totalSupply) * 100;
