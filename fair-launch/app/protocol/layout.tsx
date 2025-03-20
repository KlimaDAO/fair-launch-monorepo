import { Footer } from "@components/footer";
import { Navbar } from "@components/navbar";
import { Sidebar } from "@components/sidebar";
import type { Metadata } from "next";
import type { FC, ReactNode } from "react";
import * as styles from "./styles";
import { DisclaimerDialog } from "@components/dialogs/disclaimer-dialog";

export const metadata: Metadata = {
  title: "Klima Fair Launch dApp - Protocol",
  description: "Klima Fair Launch dApp - Protocol",
};

interface Props {
  children: ReactNode;
}

const Layout: FC<Props> = (props) => (
  <main className={styles.body}>
    <div className={styles.container}>
      <Sidebar />
      <div className={styles.main}>
        <Navbar />
        <div className={styles.content}>{props.children}</div>
        <Footer />
      </div>
    </div>
    <DisclaimerDialog />
  </main>
);

export default Layout;
