'use client';

import type { FC } from "react";
import { useState } from "react";
import { Dialog } from "radix-ui";
import { MdCelebration, MdLibraryAdd } from "react-icons/md";
import { Input } from "../../input/input";
import * as styles from './stake-dialog.styles';
import { Alert } from "../../alert/alert";

type FocusOutsideEvent = CustomEvent<{ originalEvent: FocusEvent }>;
type PointerDownOutsideEvent = CustomEvent<{ originalEvent: PointerEvent }>;

export const StakeDialog: FC = () => {
  const [shouldProceed, setShouldProceed] = useState(false);
  return (
    <Dialog.Root>
      <Dialog.Trigger className={styles.fairLaunchButton}>
        <MdCelebration />
        Participate in Klima Fair Launch
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content
          className={styles.content}
          onInteractOutside={(e: PointerDownOutsideEvent | FocusOutsideEvent) => {
            e.preventDefault();
            e.stopPropagation();
          }}>
          {!shouldProceed ? (
            <>
              <div className={styles.icon}>
                <MdLibraryAdd />
              </div>
              <Dialog.Title className={styles.title}>
                Participate in the Fair Launch!
              </Dialog.Title>
              <Dialog.Description className={styles.description}>
                Stake KLIMA to earn your share of KLIMA 2.0!
              </Dialog.Description>
              <div className={styles.actions}>
                <button
                  className={styles.primaryButton}
                  onClick={() => setShouldProceed(true)}
                >
                  Proceed
                </button>
                <Dialog.Close asChild>
                  <button className={styles.secondaryButton}>
                    Cancel
                  </button>
                </Dialog.Close>
              </div>
            </>
          ) : (
            <>
              <div className={styles.icon}>
                <MdLibraryAdd />
              </div>
              <Dialog.Title className={styles.title}>
                Stake KLIMA
              </Dialog.Title>
              <Dialog.Description className={styles.description}>
                <div className={styles.inputContainer}>
                  <label htmlFor="stake-amount">
                    Amount
                  </label>
                  <Input id="stake-amount" placeholder="0.00" />
                </div>
                <Alert variant="default">
                  <strong>Note:</strong> 
                  It is best to leave this amount staked until the end of the Fair Launch period. Unstaking your KLIMA early will result in a penalty.
                </Alert>
              </Dialog.Description>
              <div className={styles.actions}>
                <button className={styles.primaryButton}>
                  Stake
                </button>
                <Dialog.Close asChild>
                  <button className={styles.secondaryButton}>
                    Cancel
                  </button>
                </Dialog.Close>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
};