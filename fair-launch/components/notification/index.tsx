'use client';

import { FC, useEffect, useState } from "react";
import { Alert } from "@components/alert";
import { MdCheckCircle } from "react-icons/md";
import * as styles from "./styles";
import { formatNumber } from "@utils/formatting";

export const Notification: FC = () => {
  const [show, setShow] = useState(false);
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');

  const onDismiss = () => {
    setShow(false);
    window.localStorage.removeItem('stakeAmount');
    window.localStorage.removeItem('unstakeAmount');
  }

  useEffect(() => {
    const stakeAmount = window.localStorage.getItem('stakeAmount') ?? '';
    setStakeAmount(stakeAmount);
    const unstakeAmount = window.localStorage.getItem('unstakeAmount') ?? '';
    setUnstakeAmount(unstakeAmount);

    if (stakeAmount || unstakeAmount) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div className={styles.container}>
      <Alert variant="success">
        <div className={styles.content}>
          <div className={styles.titleContainer}>
            <MdCheckCircle className={styles.icon} />
            <p className={styles.title}>
              {stakeAmount ? 'Stake Successful' : 'Unstake Successful'}
            </p>
          </div>
          <div className={styles.description}>
            {stakeAmount ?
              `You have successfully staked ${formatNumber(stakeAmount, 2)} KLIMA. Check back regularly to watch your rewards grow!` :
              `You have successfully unstaked ${formatNumber(unstakeAmount, 2)} KLIMA.`}
          </div>
          <button onClick={onDismiss} className={styles.button}>
            Dismiss
          </button>
        </div>
      </Alert>
    </div>
  );
};
