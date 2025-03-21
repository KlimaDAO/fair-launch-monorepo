'use client';

import { type FC } from "react";
import Image from "next/image";
import klimaLogo from "@public/kp-logo.svg";
import { LuMenu } from "react-icons/lu";
import * as styles from "./styles";

export const Navbar: FC = () => (
  <div className={styles.navbar}>
    <Image src={klimaLogo} alt="Klima Protocol Logo" />
    <div className={styles.menuContainer}>
      <LuMenu className={styles.menuIcon} />
    </div>
  </div>
);
