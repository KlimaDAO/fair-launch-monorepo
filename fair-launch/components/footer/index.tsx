"use client";

import Link from "next/link";
import type { FC } from "react";
import { FaDiscord, FaTelegram, FaXTwitter } from "react-icons/fa6";
import * as styles from "./styles";

export const Footer: FC = () => (
  <div className={styles.footer}>
    <div className={styles.navLinks}>
      <Link
        className={styles.protocolLink}
        href="https://www.klimaprotocol.com"
        target="_blank"
      >
        KlimaProtocol.com
      </Link>
      <div className={styles.links}>
        <Link href="https://www.klimadao.finance/resource-hub" target="_blank">
          Resources
        </Link>
        <Link href="https://www.klimadao.finance/disclaimer" target="_blank">
          Disclaimer
        </Link>
        <Link
          href="https://discord.com/channels/841390338324824096/938056860651647056"
          target="_blank"
        >
          Contact
        </Link>
      </div>
    </div>
    <div className={styles.socialsContainer}>
      <div className={styles.copyright}>
        © {new Date().getFullYear()} Klima Protocol. All rights reserved.
      </div>
      <div className={styles.socials}>
        <Link
          href="https://twitter.com/KlimaDAO"
          target="_blank"
          aria-label="Follow us on X"
        >
          <FaXTwitter />
        </Link>
        <Link
          href="https://discord.com/invite/klimadao"
          target="_blank"
          aria-label="Join our Discord"
        >
          <FaDiscord />
        </Link>
        <Link
          href="https://t.me/KlimaDAO_Official"
          target="_blank"
          aria-label="Join our Telegram"
        >
          <FaTelegram />
        </Link>
      </div>
    </div>
  </div>
);
