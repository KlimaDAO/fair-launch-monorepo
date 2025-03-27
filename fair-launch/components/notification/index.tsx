'use client';

import { FC, useState } from "react";
import { Alert } from "@components/alert";
import { MdCheckCircle } from "react-icons/md";
import * as styles from "./styles";
import { usePathname, useRouter } from "next/navigation";

interface Props {
  title: string;
  description: string;
}

export const Notification: FC<Props> = (props) => {
  const router = useRouter();
  const pathname = usePathname();
  const [show, setShow] = useState(true);

  const onDismiss = () => {
    setShow(false);
    setTimeout(() => {
      router.push(pathname);
    }, 100);
  }

  if (!show) return null;

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
