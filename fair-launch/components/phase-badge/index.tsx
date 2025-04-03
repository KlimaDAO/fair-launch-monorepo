"use client";

import { FC } from "react";
import * as styles from "./styles";

const oneWeekInSeconds = 604800;
const twoWeeksInSeconds = 1209600;

type Props = {
  startTimestamp: number;
  prestakingWindow: number;
};

export const PhaseBadge: FC<Props> = ({ prestakingWindow, startTimestamp }) => {
  let phaseLabel = "";
  const currentTimestamp = Math.floor(Date.now() / 1000);

  if (currentTimestamp < Number(startTimestamp)) {
    phaseLabel = "Pre-stake Period ACTIVE";
  } else if (currentTimestamp < Number(startTimestamp) + oneWeekInSeconds) {
    phaseLabel = "2x Points Boost ACTIVE";
  } else if (currentTimestamp < Number(startTimestamp) + twoWeeksInSeconds) {
    phaseLabel = "1.5x Points Boost ACTIVE";
  } else {
    phaseLabel = "";
  }

  if (phaseLabel === '') {
    return null;
  }

  return (
    <div role="badge" className={styles.badgeVariants({ variant: "default" })}>
      {phaseLabel}
    </div>
  );
};
