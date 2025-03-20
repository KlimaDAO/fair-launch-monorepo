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

const calculatePenaltyPercentage = (part: number, total: number) => {
  console.log('total', total);
  console.log('part', part);
  // if (total === 0) throw new Error("Total cannot be zero.");
  return (part / total) * 100;
};

export const calculateUnstakePenalty = async (stakeAmount: string | bigint, stakeTimestamp: string) => {
  const burnAmount = formatTokenToValue(await calculateBurnFn(BigInt(stakeAmount), stakeTimestamp));
  const stakeAmountFormatted = formatTokenToValue(stakeAmount);
  const penaltyPercentage = calculatePenaltyPercentage(Number(burnAmount), Number(stakeAmountFormatted));
  return { burnValue: `${burnAmount}`, percentage: `${penaltyPercentage}%` };
}
