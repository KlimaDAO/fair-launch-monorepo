'use client';

import { config } from '../utils/wagmi';
import type { FC, ReactNode } from "react";
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cookieToInitialState, WagmiProvider } from 'wagmi';

const queryClient = new QueryClient();

interface Props {
  children: ReactNode;
  cookie?: string | null;
}

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
