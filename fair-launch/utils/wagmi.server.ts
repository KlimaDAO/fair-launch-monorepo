import { Config, createConfig, fallback, http } from "wagmi";
import { BASE_QUICKNODE_RPC_URL } from "./constants";
import { base } from "wagmi/chains";

export const config: Config = createConfig({
  ssr: true,
  chains: [base],
  transports: {
    [base.id]: fallback([
      http(BASE_QUICKNODE_RPC_URL),
      http("https://mainnet.base.org"),
    ]),
  },
});