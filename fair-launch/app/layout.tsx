import { WalletProvider } from "@providers/wallet-provider";
import "@rainbow-me/rainbowkit/styles.css";
import "@styles/globals.css";
import { firaCode, inter } from "@utils/fonts";
import type { Metadata } from "next";
import { headers } from "next/headers";
import type { FC, ReactNode } from "react";
import "driver.js/dist/driver.css";

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
          {props.children}
        </WalletProvider>
      </body>
    </html>
  );
};

export default RootLayout;
