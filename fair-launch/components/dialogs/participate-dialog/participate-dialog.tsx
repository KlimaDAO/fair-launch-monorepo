'use client';

import type { FC } from "react";
import { Dialog } from "radix-ui";
import { MdCelebration } from "react-icons/md";
import * as styles from './participate-dialog.styles';

export const ParticipateDialog: FC = () => (
  <Dialog.Root>
    <Dialog.Trigger className={styles.fairLaunchButton}>
      <MdCelebration />
      Participate in Klima Fair Launch
    </Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className={styles.dialogOverlay} />
      <Dialog.Content onInteractOutside={(e: any) => {
        e.preventDefault();
        e.stopPropagation();
      }} className={styles.dialogContent}>
        <Dialog.Title className={styles.dialogTitle}>
          Participate in the Fair Launch!
        </Dialog.Title>
        <Dialog.Description className={styles.dialogDescription}>
          Stake KLIMA to earn your share of KLIMA 2.0!
        </Dialog.Description>
        <div className={styles.dialogActions}>
          <button className={styles.proceedButton}>
            Proceed
          </button>
          <Dialog.Close asChild>
            <button className={styles.cancelButton}>
              Cancel
            </button>
          </Dialog.Close>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
);