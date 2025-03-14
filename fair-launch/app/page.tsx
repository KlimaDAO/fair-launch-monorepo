import { ConnectButton } from "@components/connect-button";
import { Footer } from "@components/footer";
import backgroundImage from "@public/background.png";
import Image from "next/image";
import Link from "next/link";
import type { FC } from "react";
import * as styles from "./styles";

const Page: FC = () => (
  <div className={styles.container}>
    <div className={styles.main}>
      <div className={styles.content}>
        <Image
          src={backgroundImage}
          alt="Background Cover"
          layout="fill"
          objectFit="cover"
          className={styles.backgroundImage}
        />
        <h1 className={styles.title}>Welcome</h1>
        <p className={styles.subtitle}>To Klima Fair Launch 2025.</p>
        <p className={styles.description}>Connect a wallet to get started.</p>
        <ConnectButton />
        <Link className={styles.learnMore} href="/my-rewards">
          Learn more about Klima Fair Launch
        </Link>
      </div>
      <Footer />
    </div>
  </div>
);

export default Page;
