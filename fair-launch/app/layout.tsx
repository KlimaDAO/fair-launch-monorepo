import { IntroStepProvider } from "@providers/intro-step-provider";
import { WalletProvider } from "@providers/wallet-provider";
import "@rainbow-me/rainbowkit/styles.css";
import "@styles/globals.css";
import { firaCode, inter } from "@utils/fonts";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { NextStepProvider } from "nextstepjs";
import type { FC, ReactNode } from "react";

export const metadata: Metadata = {
  title: "Klima Fair Launch",
  description: "Klima Fair Launch dApp",
};

interface Props {
  children: ReactNode;
}

const RootLayout: FC<Props> = async (props) => {
  const cookie = (await headers()).get("cookie");
  return (
    <html lang="en">
      <body className={`${inter.variable} ${firaCode.variable}`}>
        <WalletProvider cookie={cookie}>
          <NextStepProvider>
            {props.children}
          </NextStepProvider>
        </WalletProvider>
      </body>
    </html>
  );
};

export default RootLayout;
