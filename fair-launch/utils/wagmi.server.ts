import { Config, createConfig, fallback, http } from "wagmi";
import { QUICKNODE_RPC_URL } from "./constants";
import { base } from "wagmi/chains";

export const config: Config = createConfig({
  ssr: true,
  chains: [base],
  transports: {
    [base.id]: fallback([
      http(QUICKNODE_RPC_URL),
      http("https://mainnet.base.org"),
    ]),
  },
});