'use client';

import clsx from 'clsx';
import type { FC } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from 'next/navigation';
import klimaLogo from "../../public/kp-logo.svg";
import { IntroWalkthrough } from "../intro-walkthrough/intro";
import { IoTrophySharp } from "react-icons/io5";
import { MdDashboard, MdLogout } from "react-icons/md";
import * as styles from './sidebar.styles';
import { useAccount, useDisconnect } from "wagmi";

const navLinks = [
  { href: '/my-rewards', icon: <IoTrophySharp />, label: 'My Rewards' },
  { href: '/protocol', icon: <MdDashboard />, label: 'Protocol' },
];

export const Sidebar: FC = () => {
  const pathname = usePathname();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();

  return (
    <div className={styles.sidebar}>
      <Image src={klimaLogo} alt="Klima Protocol Logo" />
      <p className={styles.title}>Fair Launch 2025</p>
      <div className={styles.navLinks}>
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={
              clsx(
                styles.navLink,
                pathname === link.href && styles.activeLink
              )
            }>
            {link.icon}
            {link.label}
          </Link>
        ))}
      </div>
      <div className={styles.sidebarFooter}>
        <IntroWalkthrough />
        {address && (
          <button
            onClick={() => disconnect()}
            className={styles.logoutButton}>
            <MdLogout />
            <span>Logout</span>
          </button>
        )}
      </div>
    </div>
  )
};  