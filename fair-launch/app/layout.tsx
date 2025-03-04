import "../styles/globals.css";
import type { Metadata } from "next";
import type { FC, ReactNode } from "react";
import { headers } from 'next/headers'
import { WalletProvider } from '../providers/wallet-provider';
import { inter, firaCode } from '../utils/fonts';
import { IntroStepProvider } from '../providers/intro-step-provider';
import '@rainbow-me/rainbowkit/styles.css';

export const metadata: Metadata = {
  title: "Klima Fair Launch",
  description: "Klima Fair Launch dApp",
};

interface Props {
  children: ReactNode
};

const RootLayout: FC<Props> = async (props) => {
  const cookie = (await headers()).get("cookie");
  return (
    <html lang="en">
      <body className={`${inter.variable} ${firaCode.variable}`}>
        <IntroStepProvider>
          <WalletProvider cookie={cookie}>
            {props.children}
          </WalletProvider>
        </IntroStepProvider>
      </body>
    </html>
  )
};


export default RootLayout;
