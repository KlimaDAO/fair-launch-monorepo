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

coinbaseWallet.preference = 'smartWalletOnly';
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [coinbaseWallet, walletConnectWallet],
    },
  ],
  {
    appName: 'KlimaDAO Fair Launch',
    projectId: 'YOUR_PROJECT_ID',
  },
);

export const config: Config = createConfig({
  ssr: true,
  connectors,
  chains: [baseSepolia],
  storage: createStorage({ storage: cookieStorage }),
  transports: { [baseSepolia.id]: http() },
});
