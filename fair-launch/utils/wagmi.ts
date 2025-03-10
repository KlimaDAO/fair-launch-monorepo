import { base, baseSepolia } from 'wagmi/chains';
import { Config } from 'wagmi';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { 
  createConfig, 
  http, 
  cookieStorage,
  createStorage 
} from 'wagmi'

export const config: Config = createConfig({
  ssr: true,
  chains: [baseSepolia],
  // appName: 'Klima Fair Launch dApp',
  // projectId: 'YOUR_PROJECT_ID', // todo - replace with your project id
  storage: createStorage({ storage: cookieStorage }),
  transports: {
    [baseSepolia.id]: http(),
  },
});
