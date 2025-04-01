'use client';

import clsx from 'clsx';
import type { FC } from "react";
import Link from "next/link";
import Image from "next/image";
import klimaLogo from "@public/kp-logo.svg";
import { usePathname, useRouter } from 'next/navigation';
import { IoTrophySharp } from "react-icons/io5";
import { IntroWalkthrough } from "@components/intro-walkthrough";
import { truncateAddress } from '@utils/formatting';
import { MdDashboard, MdLogout } from "react-icons/md";
import { useAccount, useDisconnect } from "wagmi";
import * as styles from './styles';

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
    window.location.reload();
    setTimeout(() => {
      router.push('/');
    }, 100);
  };

  return (
    <div className={styles.sidebar}>
      <Image src={klimaLogo} alt="Klima Protocol Logo" />
      <div className={styles.titleContainer}>
        <p className={styles.title}>Fair Launch 2025</p>
        {address &&
          <div className={styles.walletAddress}>
            Your Wallet Address:
            <span>{truncateAddress(address as string)}</span>
          </div>
        }
      </div>
      <div className={styles.navLinks}>
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            id={link.href === '/protocol' ? 'step5' : ''}
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