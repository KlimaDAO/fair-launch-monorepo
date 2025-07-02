"use client";

import Link from "next/link";
import type { FC } from "react";
import { URLS } from "@utils/constants";
import { FaDiscord, FaTelegram, FaXTwitter } from "react-icons/fa6";
import * as styles from "./styles";

export const Footer: FC = () => (
  <div className={styles.footer}>
    <div className={styles.navLinks}>
      <Link
        className={styles.protocolLink}
        href={URLS.protocol}
        target="_blank"
      >
        KlimaProtocol.com
      </Link>
      <div className={styles.links}>
        <Link href={URLS.resources} target="_blank">
          Resources
        </Link>
        <Link href={URLS.disclaimer} target="_blank">
          Disclaimer
        </Link>
        <Link href={URLS.contact} target="_blank">
          Contact
        </Link>
      </div>
    </div>
    <div className={styles.socialsContainer}>
      <div className={styles.copyright}>
        © {new Date().getFullYear()} Klima Protocol. All rights reserved.
      </div>
      <div className={styles.socials}>
        <Link href={URLS.twitter} target="_blank" aria-label="Follow us on X">
          <FaXTwitter />
        </Link>
        <Link href={URLS.discord} target="_blank" aria-label="Join our Discord">
          <FaDiscord />
        </Link>
        <Link href={URLS.telegram} target="_blank" aria-label="Join our Telegram">
          <FaTelegram />
        </Link>
      </div>
    </div>
  </div>
);
