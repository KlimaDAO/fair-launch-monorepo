import { Config } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import {
  createConfig,
  http,
  cookieStorage,
  createStorage,
} from 'wagmi';
import {
  coinbaseWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [coinbaseWallet, walletConnectWallet],
    },
  ],
  {
    appName: 'KlimaDAO Fair Launch',
    // replace with official project id
    projectId: 'd70d1ad9ea2bed68ed81737f44a75ef0',
  },
);

export const config: Config = createConfig({
  ssr: true,
  connectors,
  chains: [baseSepolia],
  storage: createStorage({ storage: cookieStorage }),
  transports: { [baseSepolia.id]: http() },
});
