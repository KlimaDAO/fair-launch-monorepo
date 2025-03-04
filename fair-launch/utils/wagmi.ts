import { base } from 'wagmi/chains';
import { Config } from 'wagmi';
import { cookieStorage, createStorage } from 'wagmi';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

export const config: Config = getDefaultConfig({
  ssr: true,
  chains: [base],
  appName: 'Klima Fair Launch dApp',
  projectId: 'YOUR_PROJECT_ID', // todo - replace with your project id
  storage: createStorage({ storage: cookieStorage }),
});
