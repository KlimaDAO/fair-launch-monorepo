import { IntroStepProvider } from "@providers/intro-step-provider";
import { WalletProvider } from "@providers/wallet-provider";
import "@rainbow-me/rainbowkit/styles.css";
import "@styles/globals.css";
import { firaCode, inter } from "@utils/fonts";
import type { Metadata } from "next";
import { headers } from "next/headers";
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
  // let wagmiStoreCookie = null;

  // if (cookie) {
  //   const cookies = cookie.split('; ');
  //   wagmiStoreCookie = cookies.find(cook => cook.startsWith('wagmi.store='));

  //   if (wagmiStoreCookie) {
  //     const cookieValue = wagmiStoreCookie.split('=')[1];
  //     const parsed = JSON.parse(decodeURIComponent(cookieValue));
  //     console.log('parsed', parsed.state.connections.value);
  //   }
  // }
  return (
    <html lang="en">
      <body className={`${inter.variable} ${firaCode.variable}`}>
        <WalletProvider cookie={cookie}>
          <IntroStepProvider>{props.children}</IntroStepProvider>
        </WalletProvider>
      </body>
    </html>
  );
};

export default RootLayout;
