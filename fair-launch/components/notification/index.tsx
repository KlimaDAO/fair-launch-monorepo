'use client';

import { FC } from "react";
import { Alert } from "@components/alert";
import { MdCheckCircle } from "react-icons/md";
import { useRouter } from "next/navigation";
import * as styles from "./styles";
interface Props {
  title: string;
  description: string;
}

export const Notification: FC<Props> = (props) => {
  const router = useRouter();
  const onDismiss = () => router.push('/my-rewards'); // fix path

  return (
    <div className={styles.container}>
      <Alert variant="success">
        <div className={styles.content}>
          <div className={styles.titleContainer}>
            <MdCheckCircle className={styles.icon} />
            <p className={styles.title}>{props.title}</p>
          </div>
          <div className={styles.description}>
            {props.description}
          </div>
          <button onClick={onDismiss} className={styles.button}>
            Dismiss
          </button>
        </div>
      </Alert>
    </div>
  );
};
