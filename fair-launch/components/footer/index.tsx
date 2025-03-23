'use client';

import Link from 'next/link';
import type { FC } from 'react';
import { FaXTwitter, FaDiscord } from "react-icons/fa6";
import * as styles from './styles';

export const Footer: FC = () => (
  <div className={styles.footer}>
    <div className={styles.navLinks}>
      <Link href="https://www.klimadao.finance/buy" target="_blank">$KLIMA</Link>
      <Link href="https://www.klimadao.finance/governance" target="_blank">Governance</Link>
      <Link href="https://app.klimadao.finance/" target="_blank">Infrastructure</Link>
      <Link href="https://carbon.klimadao.finance/" target="_blank">Ecosystem</Link>
      <Link href="https://docs.klimadao.finance/developers/" target="_blank">Builders</Link>
      <Link href="https://www.klimadao.finance/blog" target="_blank">Resources</Link>
      <Link href="https://www.klimadao.finance/disclaimer" target="_blank">Disclaimer</Link>
    </div>
    <div className={styles.socials}>
      <Link href="https://twitter.com/KlimaDAO" target="_blank" aria-label="Follow us on X">
        <FaXTwitter />
      </Link>
      <Link href="https://discord.com/invite/klimadao" target="_blank" aria-label="Join our Discord">
        <FaDiscord />
      </Link>
    </div>
    <div className={styles.copyright}>
      © 2020 Klima Protocol. All rights reserved.
    </div>
  </div>
);


