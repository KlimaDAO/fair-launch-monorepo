'use client';

import { useState, type FC } from "react";
import Image from "next/image";
import klimaLogo from "@public/kp-logo.svg";
import { LuMenu } from "react-icons/lu";
import { MdClose, MdDashboard, MdLogout } from "react-icons/md";
import { useAccount, useDisconnect } from "wagmi";
import { usePathname, useRouter } from "next/navigation";
import { IoTrophySharp } from "react-icons/io5";
import Link from "next/link";
import clsx from 'clsx';
import * as styles from './styles';
// import { IntroWalkthrough } from "@components/intro-walkthrough";

const navLinks = [
  { href: '/my-rewards', icon: <IoTrophySharp />, label: 'My Rewards' },
  { href: '/protocol', icon: <MdDashboard />, label: 'Protocol' },
];

export const Navbar: FC = () => {
  const router = useRouter();
  const pathname = usePathname();
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
            {isMenuOpen ? <MdClose className={styles.menuIcon} /> : <LuMenu className={styles.menuIcon} />}
          </button>
        )}
      </div>
      {isMenuOpen && (
        <div className={styles.flyoutMenu}>
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
          <div className={styles.buttonContainer}>
            {/* <IntroWalkthrough /> */}
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
      )}
    </div>
  )
};
