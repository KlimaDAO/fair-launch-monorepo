"use client";

import { type FC, type ReactNode } from "react";
import * as styles from "./styles";

export const Card: FC<{ children: ReactNode }> = (props) => {
  return (
    <div className={styles.cardContainer}>
      <div className={styles.card}>{props.children}</div>
    </div>
  );
};
