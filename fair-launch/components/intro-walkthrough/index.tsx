'use client';

import type { FC } from 'react';
import { useNextStep } from 'nextstepjs';
import * as styles from './styles';
import { MdHelpOutline } from 'react-icons/md';

export const IntroWalkthrough: FC = () => {
  const { startNextStep } = useNextStep();

  const handleWalkthrough = () => {
    startNextStep("walkthrough");
  }

  return (
    <button className={styles.button} onClick={handleWalkthrough}>
      <MdHelpOutline />
      Show me around
    </button>
  );
};
