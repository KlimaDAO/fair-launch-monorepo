import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  coinbaseWallet,
  metaMaskWallet,
  phantomWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import {
  Config,
  cookieStorage,
  createConfig,
  createStorage,
  fallback,
  http,
} from "wagmi";
import { base } from "wagmi/chains";
import { QUICKNODE_RPC_URL } from "./constants";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Popular",
      wallets: [
        metaMaskWallet,
        coinbaseWallet,
        phantomWallet,
        walletConnectWallet,
      ],
    },
  ],
  {
    appName: "KlimaDAO Fair Launch",
    // replace with official project id
    projectId: "d70d1ad9ea2bed68ed81737f44a75ef0",
  }
);

export const config: Config = createConfig({
  ssr: true,
  connectors,
  chains: [base],
  storage: createStorage({ storage: cookieStorage }),
  transports: {
    [base.id]: fallback([
      http(QUICKNODE_RPC_URL),
      http("https://mainnet.base.org"),
    ]),
  },
});
