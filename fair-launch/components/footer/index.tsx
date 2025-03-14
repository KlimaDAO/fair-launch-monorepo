'use client';

import Link from 'next/link';
import type { FC } from 'react';
import { FaTelegramPlane, FaLinkedinIn } from 'react-icons/fa';
import { FaXTwitter, FaDiscord, FaYoutube } from "react-icons/fa6";
import * as styles from './styles';

export const Footer: FC = () => {
  const currentYear = new Date().getFullYear();
  return (
    <div className={styles.footer}>
      <div className={styles.navLinks}>
        <Link href="#">$KLIMA</Link>
        <Link href="#">Governance</Link>
        <Link href="#">Infrastructure</Link>
        <Link href="#">Ecosystem</Link>
        <Link href="#">Builders</Link>
        <Link href="#">Resources</Link>
        <Link href="#">Disclaimer</Link>
      </div>
      <div className={styles.socials}>
        <Link href="#" aria-label="Follow us on X">
          <FaXTwitter />
        </Link>
        <Link href="#" aria-label="Follow us on Youtube">
          <FaYoutube />
        </Link>
        <Link href="#" aria-label="Follow us on LinkedIn">
          <FaLinkedinIn />
        </Link>
        <Link href="#" aria-label="Join our Discord">
          <FaDiscord />
        </Link>
        <Link href="#" aria-label="Join our Telegram">
          <FaTelegramPlane />
        </Link>
      </div>
      <div className={styles.copyright}>
        © {currentYear} Klima Protocol. All rights reserved.
      </div>
    </div>
  )
};

