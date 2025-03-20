import { readContract } from "@wagmi/core";
import { config } from "@utils/wagmi";
import { abi as klimaFairLaunchAbi } from "@abi/klima-fair-launch";
import { FAIR_LAUNCH_CONTRACT_ADDRESS } from "./constants";

export const calculateBurnFn = async (amount: bigint, timestamp: bigint) => {
  return await readContract(config, {
    abi: klimaFairLaunchAbi,
    address: FAIR_LAUNCH_CONTRACT_ADDRESS,
    functionName: "calculateBurn",
    args: [amount, timestamp],
  }) as bigint;
};