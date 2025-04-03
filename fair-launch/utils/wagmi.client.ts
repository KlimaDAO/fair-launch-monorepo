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
  http,
} from "wagmi";
import { base, baseSepolia } from "wagmi/chains";

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
  chains: [baseSepolia, base],
  storage: createStorage({ storage: cookieStorage }),
  transports: {
    [baseSepolia.id]: http(),
    [base.id]: http(),
  },
});
