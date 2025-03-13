import "@styles/globals.css";
import type { Metadata } from "next";
import type { FC, ReactNode } from "react";
import { IntroStepProvider } from '@providers/intro-step-provider';
import * as styles from './page.styles';

export const metadata: Metadata = {
  title: "Klima Fair Launch dApp - Protocol",
  description: "Klima Fair Launch dApp - Protocol",
};

interface Props {
  children: ReactNode
};

const Layout: FC<Props> = async (props) => {
  return (
    <IntroStepProvider>
      <main className={styles.body}>
        {props.children}
      </main>
    </IntroStepProvider>
  )
};


export default Layout;
