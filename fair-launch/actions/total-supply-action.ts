"use server";

import { abi as erc20Abi } from "@abi/erc20";
import { readContract } from "@wagmi/core";
import { AbiFunction, http } from "viem";
import { polygon } from "viem/chains";
import { Config } from "wagmi";
import { createConfig } from "wagmi";

const polygonConfig: Config = createConfig({
  ssr: true,
  chains: [polygon],
  transports: {
    [polygon.id]: http(),
  },
});

export const getTotalSupply = async () => {
  try {
    const totalSupply = await readContract(polygonConfig, {
      abi: erc20Abi as AbiFunction[],
      address: '0x4e78011Ce80ee02d2c3e649Fb657E45898257815',
      functionName: "totalSupply",
    });

    return totalSupply;
  } catch (error) {
    console.error("error", error);
  }
};
