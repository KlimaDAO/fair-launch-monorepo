'use client';

import clsx from 'clsx';
import type { FC } from "react";
import { Input } from "@components/input/input";
import { Dialog } from "radix-ui";
import { useState } from "react";
import { parseEther } from 'viem'
import { useAccount, useWriteContract } from "wagmi";
import { MdAccountBalance, MdWarningAmber } from "react-icons/md";
import { abi } from '../../../abi/klima-fair-launch';
import * as styles from './unstake-dialog.styles';

type FocusOutsideEvent = CustomEvent<{ originalEvent: FocusEvent }>;
type PointerDownOutsideEvent = CustomEvent<{ originalEvent: PointerEvent }>;

// TODO - move to constants...
const contractAddress = '0x5D7c2a994Ca46c2c12a605699E65dcbafDeae80c';
const klimaTokenAddress = '0x3E63e9c64942399e987A04f0663A5c1Cba9c148A';

export const UnstakeDialog: FC = () => {
  const { address } = useAccount();
  const [shouldProceed, setShouldProceed] = useState(false);
  const [confirmScreen, setConfirmScreen] = useState(false);
  const { data: unstakeData, writeContract: unstakeContract } = useWriteContract();

  // add steps to keep track of the state of which dialog to show...

  const unstake = async () => {
    await unstakeContract({
      abi,
      functionName: 'unstake',
      address: contractAddress,
      args: [parseEther('0.00000000000000005')],
    });
  };

  const handleUnstake = async () => {
    await unstake();
  };

  return (
    <Dialog.Root>
      <Dialog.Trigger className={styles.unstakeButton}>
        Unstake
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className={clsx(styles.overlay, {
          [styles.confirmOverlay]: confirmScreen,
        })} />
        <Dialog.Content
          className={styles.content}
          onInteractOutside={(e: PointerDownOutsideEvent | FocusOutsideEvent) => {
            e.preventDefault();
            e.stopPropagation();
          }}>
          {!shouldProceed ? (
            <>
              <div className={styles.icon}>
                <MdWarningAmber />
              </div>
              <Dialog.Title className={styles.title}>
                Hold on there, partner!
              </Dialog.Title>
              <Dialog.Description className={styles.description}>
                The longer you leave your KLIMA staked, the better your rewards! If you unstake now, you’ll not only lose out on some KLIMA through the burn mechanism, but you’ll also miss out on KLIMAX!
                <br /><br />
                Make sure you have a good reason to unstake before you go clickin’ buttons.
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
          ) : confirmScreen ? (
            <>
              <Dialog.Title className={styles.title}>
                Confirm your transaction
              </Dialog.Title>
              <div className={styles.description}>
                <p>Give the transaction one final review before submitting to the blockchain.</p>
                <div className={styles.inputContainer}>
                  <label htmlFor="stake-amount">
                    Contract Address
                  </label>
                  <Input id="stake-amount" placeholder="0.00" />
                </div>
                <div className={styles.inputContainer}>
                  <label htmlFor="stake-amount">
                    You are sending
                  </label>
                  <Input id="stake-amount" placeholder="0.00" />
                </div>
              </div>
              <div className={styles.actions}>
                <button className={styles.primaryButton} onClick={() => {
                  setShouldProceed(false);
                  setConfirmScreen(false);
                }}>
                  Submit
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
                <MdAccountBalance />
              </div>
              <Dialog.Title className={styles.title}>
                Unstake
              </Dialog.Title>
              <div className={styles.description}>
                <div className={styles.inputContainer}>
                  <label htmlFor="stake-amount">
                    Amount
                  </label>
                  <Input id="stake-amount" placeholder="0.00" />
                </div>
              </div>
              <div className={styles.actions}>
                <button
                  className={styles.primaryButton}
                  onClick={handleUnstake}>
                  Unstake
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