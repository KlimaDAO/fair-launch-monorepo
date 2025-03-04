'use client';

import type { FC } from "react";
import * as styles from './badge.styles';

interface Props { title: string }

export const Badge: FC<Props> = (props) => 
  <div className={styles.badge}>{props.title}</div>;

