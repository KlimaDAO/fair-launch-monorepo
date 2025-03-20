'use client';

import { config } from '../utils/wagmi.client';
import type { FC, ReactNode } from "react";
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cookieToInitialState, WagmiProvider } from 'wagmi';

interface Props {
  children: ReactNode;
  cookie?: string | null;
}

const queryClient = new QueryClient();

export const WalletProvider: FC<Props> = (props) => {
  const initialState = cookieToInitialState(config, props.cookie);
  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{props.children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
} 
