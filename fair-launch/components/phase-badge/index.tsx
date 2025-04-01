'use client';

import { FC } from "react";
import * as React from "react";
import * as styles from './styles';

const threeDaysInSeconds = 259200;
const oneWeekInSeconds = 604800;
const twoWeeksInSeconds = 1209600;

export const PhaseBadge: FC<{ startTimestamp: string }> = ({ startTimestamp }) => {

  let phaseLabel = '';
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const elapsedTime = Number(currentTimestamp) - Number(startTimestamp);

  if (elapsedTime < threeDaysInSeconds) {
    phaseLabel = "Pre-stake Period ACTIVE";
  } else if (
    currentTimestamp < Number(startTimestamp) ||
    currentTimestamp - Number(startTimestamp) < oneWeekInSeconds
  ) {
    phaseLabel = "2x Points Boost ACTIVE";
  } else if (currentTimestamp - Number(startTimestamp) < twoWeeksInSeconds) {
    phaseLabel = "1.5x Points Boost ACTIVE";
  }

  return (
    <div
      role="badge"
      className={styles.badgeVariants({ variant: 'default' })}
    >
      {phaseLabel}
    </div>
  );
}
