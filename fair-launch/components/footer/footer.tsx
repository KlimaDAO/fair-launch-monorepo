'use client';

import type { FC } from 'react';
import Link from 'next/link';
import { FaTelegramPlane, FaLinkedinIn } from 'react-icons/fa';
import { FaXTwitter, FaDiscord, FaYoutube } from "react-icons/fa6";
import * as styles from './footer.styles';

export const Footer: FC = () => (
  <div className={styles.footer}>
    <div className={styles.navLinks}>
      <Link href="/">$KLIMA</Link>
      <Link href="/">Governance</Link>
      <Link href="/">Infrastructure</Link>
      <Link href="/">Ecosystem</Link>
      <Link href="/">Builders</Link>
      <Link href="/">Resources</Link>
      <Link href="/">Disclaimer</Link>
    </div>
    <div className={styles.socials}>
      <FaXTwitter />
      <FaYoutube />
      <FaLinkedinIn />
      <FaDiscord />
      <FaTelegramPlane />
    </div>
    <p className={styles.copyright}>
      © 2020 Klima Protocol. All rights reserved.
    </p>
  </div>
);

