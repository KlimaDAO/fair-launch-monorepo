import { Config } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import {
  createConfig,
  http,
} from 'wagmi'

export const config: Config = createConfig({
  ssr: true,
  chains: [baseSepolia],
  transports: { [baseSepolia.id]: http() },
});