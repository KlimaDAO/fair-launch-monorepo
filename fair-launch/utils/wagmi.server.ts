import { Config } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import {
  createConfig,
  http,
  cookieStorage,
  createStorage,
} from 'wagmi'

export const config: Config = createConfig({
  ssr: true,
  chains: [baseSepolia],
  storage: createStorage({ storage: cookieStorage }),
  transports: { [baseSepolia.id]: http() },
});
