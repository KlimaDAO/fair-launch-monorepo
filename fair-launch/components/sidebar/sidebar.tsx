'use client';

import clsx from 'clsx';
import type { FC } from "react";
import Link from "next/link";
import Image from "next/image";
import klimaLogo from "@public/kp-logo.svg";
import { usePathname, useRouter } from 'next/navigation';
import { IoTrophySharp } from "react-icons/io5";
import { IntroWalkthrough } from "@components/intro-walkthrough/intro";
import { MdDashboard, MdLogout } from "react-icons/md";
import { useAccount, useDisconnect } from "wagmi";
import * as styles from './sidebar.styles';

const navLinks = [
  { href: '/my-rewards', icon: <IoTrophySharp />, label: 'My Rewards' },
  { href: '/protocol', icon: <MdDashboard />, label: 'Protocol' },
];

export const Sidebar: FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();

  const handleLogout = async () => {
    await disconnect();
    setTimeout(() => router.push('/'), 100);
  };

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
            onClick={handleLogout}
            className={styles.logoutButton}>
            <MdLogout />
            <span>Logout</span>
          </button>
        )}
      </div>
    </div>
  )
};  