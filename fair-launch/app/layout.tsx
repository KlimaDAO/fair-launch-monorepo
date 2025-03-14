import { Footer } from "@components/footer/footer";
import { IntroStepProvider } from "@providers/intro-step-provider";
import { WalletProvider } from "@providers/wallet-provider";
import "@rainbow-me/rainbowkit/styles.css";
import "@styles/globals.css";
import { firaCode, inter } from "@utils/fonts";
import type { Metadata } from "next";
import { headers } from "next/headers";
import type { FC, ReactNode } from "react";
import * as styles from "./styles";

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
          <IntroStepProvider>
            <div className={styles.container}>
              <div className={styles.main}>
                <div className={styles.content}>{props.children}</div>
                <Footer />
              </div>
            </div>
          </IntroStepProvider>
        </WalletProvider>
      </body>
    </html>
  );
};

export default RootLayout;
