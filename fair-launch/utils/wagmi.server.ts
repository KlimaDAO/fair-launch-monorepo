import { Config, createConfig, http } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";

export const config: Config = createConfig({
  ssr: true,
  chains: [baseSepolia, base],
  transports: {
    [baseSepolia.id]: http(),
    [base.id]: http(),
  },
});