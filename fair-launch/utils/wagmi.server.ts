import { Config, createConfig, http } from "wagmi";
import { base } from "wagmi/chains";

export const config: Config = createConfig({
  ssr: true,
  chains: [base],
  transports: {
    [base.id]: http(),
  },
});