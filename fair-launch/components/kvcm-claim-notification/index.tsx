"use client";

import { Alert } from "@components/alert";
import clsx from "clsx";
import { FC } from "react";
import { MdCheckCircle, MdInfoOutline } from "react-icons/md";
import * as styles from "./styles";

type Props = {
  isKvcmClaimEnabled: boolean;
};

export const KvcmClaimNotification: FC<Props> = ({ isKvcmClaimEnabled }) => (
  <div className={styles.container}>
    {isKvcmClaimEnabled ? (
      <Alert variant="success">
        <div className={styles.content}>
          <div className={styles.titleContainer}>
            <MdCheckCircle className={styles.icon} />
            <p className={styles.title}>Claim is open.</p>
          </div>
          <div className={clsx(styles.description, "claim")}>
            You can now claim kVCM. Your K2 allocation starts vesting at
            protocol launch.
          </div>
        </div>
      </Alert>
    ) : (
      <Alert variant="closed">
        <div className={styles.content}>
          <div className={styles.titleContainer}>
            <MdInfoOutline className={clsx(styles.icon, "closed")} />
            <p className={styles.title}>Staking phase is closed.</p>
          </div>
          <div className={clsx(styles.description, "closed")}>
            We're finalizing totals for claim. Claim coming soon.
          </div>
        </div>
      </Alert>
    )}
  </div>
);
