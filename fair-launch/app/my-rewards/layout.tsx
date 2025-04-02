import { DisclaimerDialog } from "@components/dialogs/disclaimer-dialog";
import { Footer } from "@components/footer";
import { Navbar } from "@components/navbar";
import { Sidebar } from "@components/sidebar";
import type { Metadata } from "next";
import type { FC, ReactNode } from "react";
import * as styles from "./styles";

export const metadata: Metadata = {
  title: "Klima Fair Launch dApp - My Rewards",
  description: "Klima Fair Launch dApp - My Rewards",
};

interface Props {
  children: ReactNode;
}

const Layout: FC<Props> = (props) => (
  <main className={styles.body}>
    <Navbar />
    <div className={styles.container}>
      <Sidebar />
      <div className={styles.main}>
        <div className={styles.content}>{props.children}</div>
        <Footer />
      </div>
    </div>
    <DisclaimerDialog />
  </main>
);

export default Layout;
