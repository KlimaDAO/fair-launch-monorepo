'use client';

import { useState, type FC } from "react";
import Image from "next/image";
import klimaLogo from "@public/kp-logo.svg";
import { LuMenu } from "react-icons/lu";
import * as styles from "./styles";
import { MdClose } from "react-icons/md";
import { useAccount, useDisconnect } from "wagmi";
import { useRouter } from "next/navigation";
import Link from "next/link";

export const Navbar: FC = () => {
  const router = useRouter();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await disconnect();
    setIsMenuOpen(!isMenuOpen);
    setTimeout(() => router.push('/'), 100);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className={styles.navbar}>
      <Image src={klimaLogo} alt="Klima Protocol Logo" />
      <div className={styles.menuContainer}>
        {address && (
          <button onClick={toggleMenu}>
            <LuMenu className={styles.menuIcon} />
          </button>
        )}
      </div>
      {isMenuOpen && (
        <div className={styles.fullScreenMenu}>
          <button onClick={toggleMenu} className={styles.closeButton}>
            <MdClose fontSize="2.8rem" />
          </button>
          <nav className={styles.nav}>
            <ul>
              <li><Link href="/my-rewards">My Rewards</Link></li>
              <li><Link href="/protocol">Protocol</Link></li>
              <li><div onClick={handleLogout}>Logout</div></li>
            </ul>
          </nav>
        </div>
      )}
    </div>
  )
};
