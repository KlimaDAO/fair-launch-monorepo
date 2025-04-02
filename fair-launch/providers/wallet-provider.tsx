"use client";

import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { FC, ReactNode } from "react";
import { cookieToInitialState, WagmiProvider } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { config } from "../utils/wagmi.client";

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
        <RainbowKitProvider initialChain={baseSepolia}>
          {props.children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
