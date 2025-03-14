import type { Metadata } from "next";
import type { FC, ReactNode } from "react";
import * as styles from './page.styles';

export const metadata: Metadata = {
  title: "Klima Fair Launch dApp - My Rewards",
  description: "Klima Fair Launch dApp - My Rewards",
};

interface Props {
  children: ReactNode
};

const Layout: FC<Props> = (props) => (
  <main className={styles.body}>
    {props.children}
  </main>
);

export default Layout;
