'use client';

import clsx from 'clsx';
import type { FC } from "react";
import { Input } from "@components/input/input";
import { Dialog } from "radix-ui";
import { useState } from "react";
import { parseEther } from 'viem'
import { useAccount, useWriteContract } from "wagmi";
import { MdAccountBalance, MdWarningAmber } from "react-icons/md";
import { abi as klimaFairLaunchAbi } from "@abi/klima-fair-launch";
import * as styles from './unstake-dialog.styles';

type FocusOutsideEvent = CustomEvent<{ originalEvent: FocusEvent }>;
type PointerDownOutsideEvent = CustomEvent<{ originalEvent: PointerEvent }>;

// TODO - move to constants...
const contractAddress = "0x5D7c2a994Ca46c2c12a605699E65dcbafDeae80c";
const klimaTokenAddress = '0x3E63e9c64942399e987A04f0663A5c1Cba9c148A';

interface UnstakeDialogProps {
  amount: string;
}

export const UnstakeDialog: FC<UnstakeDialogProps> = ({ amount }) => {
  const { address } = useAccount();
  const [shouldProceed, setShouldProceed] = useState(false);
  const [confirmScreen, setConfirmScreen] = useState(false);
  const { data: unstakeData, writeContract: unstakeContract } = useWriteContract();

  // add steps to keep track of the state of which dialog to show...

  const handleUnstake = () => {
    unstakeContract({
      abi: klimaFairLaunchAbi,
      functionName: 'unstake',
      address: contractAddress,
      args: [BigInt(amount)],
    });
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
          ) : (
            <>
              <Dialog.Title className={styles.title}>
                Confirm your transaction
              </Dialog.Title>
              <div className={styles.description}>
                <p>Give the transaction one final review before submitting to the blockchain.</p>
                <div className={styles.inputContainer}>
                  <label htmlFor="contract-address">
                    Contract Address
                  </label>
                  <Input disabled id="contract-address" value="0x8cE...5f8" />
                </div>
                <div className={styles.inputContainer}>
                  <label htmlFor="stake-amount">
                    You are sending
                  </label>
                  <Input disabled id="stake-amount" value={`${amount} KLIMA`} />
                </div>
              </div>
              <div className={styles.actions}>
                <button className={styles.primaryButton} onClick={() => {
                  handleUnstake();
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
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
};