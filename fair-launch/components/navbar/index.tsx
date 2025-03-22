'use client';

import { type FC } from "react";
import Image from "next/image";
import klimaLogo from "@public/kp-logo.svg";
import { LuMenu } from "react-icons/lu";
import * as styles from "./styles";
import { MdLogout } from "react-icons/md";
import { useAccount, useDisconnect } from "wagmi";
import { useRouter } from "next/navigation";

export const Navbar: FC = () => {
  const router = useRouter();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();

  const handleLogout = async () => {
    await disconnect();
    setTimeout(() => router.push('/'), 100);
  };

  return (
    <div className={styles.navbar}>
      <Image src={klimaLogo} alt="Klima Protocol Logo" />
      <div className={styles.menuContainer}>
        {/* <LuMenu className={styles.menuIcon} /> */}
        {address && (
          <button
            onClick={handleLogout}>
            <LuMenu className={styles.menuIcon} />
            <span>Logout</span>
          </button>
        )}
      </div>
    </div>
  )
};
