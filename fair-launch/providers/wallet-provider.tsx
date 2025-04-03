"use client";

import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { FC, ReactNode } from "react";
import { cookieToInitialState, WagmiProvider } from "wagmi";
import { getConfig } from "@utils/constants";
import { config as wagmiConfig } from "@utils/wagmi.client";
import { base } from "wagmi/chains";

interface Props {
  children: ReactNode;
  cookie?: string | null;
}

const queryClient = new QueryClient();

export const WalletProvider: FC<Props> = (props) => {
  const config = getConfig();
  const initialState = cookieToInitialState(wagmiConfig, props.cookie);
  return (
    <WagmiProvider config={wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider initialChain={config.chain}>
          {props.children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
