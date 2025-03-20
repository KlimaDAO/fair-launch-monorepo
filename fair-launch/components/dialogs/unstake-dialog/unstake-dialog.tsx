'use client';

import clsx from 'clsx';
import Link from 'next/link';
import type { FC } from "react";
import { Input } from "@components/input";
import { Dialog } from "radix-ui";
import { useState } from "react";
import { formatUnits } from 'viem'
import { abi as klimaFairLaunchAbi } from "@abi/klima-fair-launch";
import { FAIR_LAUNCH_CONTRACT_ADDRESS } from '@utils/constants';
import { useAccount, useWriteContract } from "wagmi";
import { MdAccountBalance, MdWarningAmber } from "react-icons/md";
import * as styles from './unstake-dialog.styles';

type FocusOutsideEvent = CustomEvent<{ originalEvent: FocusEvent }>;
type PointerDownOutsideEvent = CustomEvent<{ originalEvent: PointerEvent }>;

interface UnstakeDialogProps {
  amount: string;
}

enum DialogState {
  INITIAL,
  UNSTAKE,
  CONFIRM_UNSTAKE,
  CONFIRM,
}

export const UnstakeDialog: FC<UnstakeDialogProps> = ({ amount }) => {
  const [open, setOpen] = useState(false);
  const [unstakeAmount, setUnstakeAmount] = useState("");
  const [dialogState, setDialogState] = useState(DialogState.INITIAL);
  const { data: unstakeData, writeContract: unstakeContract } = useWriteContract();

  // add steps to keep track of the state of which dialog to show...

  const handleDialogState = () => {
    setOpen(!open);
    // reset dialog state when dialog is closed
    if (open) setDialogState(DialogState.INITIAL);
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUnstakeAmount(e.target.value);
  };

  const handleProceed = () => {
    setDialogState(DialogState.UNSTAKE);
  };

  const handleUnstake = () => {
    setDialogState(DialogState.CONFIRM_UNSTAKE);
  };

  const handleConfirmUnstake = () => {
    setDialogState(DialogState.CONFIRM);
  };

  const handleConfirm = () => {
    console.log("unstakeAmount", unstakeAmount);
    unstakeContract({
      abi: klimaFairLaunchAbi,
      functionName: 'unstake',
      address: FAIR_LAUNCH_CONTRACT_ADDRESS,
      args: [BigInt(10) * BigInt(10 ** 9)],
    });
  };

  const InitialView = () => {
    return (
      <>
        <div className={styles.icon}>
          <MdWarningAmber />
        </div>
        <Dialog.Title className={styles.title}>
          Hold on there, partner!
        </Dialog.Title>
        <div className={styles.altDescription}>
          <div>The longer you leave your KLIMA staked, the better your rewards! If you unstake now, you’ll not only lose out on some KLIMA through <Link href="/">the burn mechanism</Link>,
            but you’ll also miss out on KLIMAX!</div>
          <div>Make sure you have a good reason to unstake before you go clickin’ buttons.</div>
        </div>
        <div className={styles.actions}>
          <button
            onClick={handleProceed}
            className={styles.primaryButton}
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
    )
  }

  const UnstakeView = () => {
    return (
      <div className={styles.content}>
        <div className={styles.icon}>
          <MdAccountBalance />
        </div>
        <Dialog.Title className={styles.title}>Unstake</Dialog.Title>
        <div className={styles.description}>
          <div className={styles.inputContainer}>
            <label htmlFor="stake-amount">Amount</label>
            <div className={styles.inputRow}>
              <Input
                id="stake-amount"
                value={formatUnits(BigInt(amount), 9)}
                placeholder={formatUnits(BigInt(amount), 9)}
                onChange={handleChange}
                className={styles.input}
              />
              <button className={styles.maxButton}>Max</button>
            </div>
          </div>
          <div className={styles.infoRowContainer}>
            <div className={styles.infoRow}>
              <p>Burn Amount</p>
              <p><strong>0.00</strong> KLIMA</p>
            </div>
            <div className={styles.infoRow}>
              <p>Receive Amount</p>
              <p><strong>0.00</strong> KLIMA</p>
            </div>
          </div>
        </div>
        <div className={styles.actions}>
          <button className={styles.primaryButton} onClick={handleUnstake}>
            Unstake
          </button>
          <Dialog.Close asChild>
            <button className={styles.secondaryButton}>Cancel</button>
          </Dialog.Close>
        </div>
      </div>
    );
  }

  const ConfirmUnstakeView = () => {
    return (
      <>
        <div className={styles.icon}>
          <MdWarningAmber />
        </div>
        <Dialog.Title className={styles.title}>
          Confirm Unstake
        </Dialog.Title>
        <div className={styles.altDescription}>
          <div>Are you sure you'd like to unstake {amount} KLIMA? You will burn this KLIMA and <strong>will not be able to re-stake it.</strong></div>
          <div>You will still get to keep the points and KLIMAX you've accrued.</div>
          <Link href="/">Learn more about burning KLIMA.</Link>
        </div>
        <div className={styles.actions}>
          <button onClick={handleConfirmUnstake} className={styles.primaryButton}>
            Confirm
          </button>
          <Dialog.Close asChild>
            <button className={styles.secondaryButton}>
              Cancel
            </button>
          </Dialog.Close>
        </div>
      </>
    )
  }

  const ConfirmView = () => {
    return (
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
          <button className={styles.primaryButton} onClick={handleConfirm}>
            Submit
          </button>
          <Dialog.Close asChild>
            <button className={styles.secondaryButton}>
              Cancel
            </button>
          </Dialog.Close>
        </div>
      </>
    )
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleDialogState}>
      <Dialog.Trigger className={styles.unstakeButton}>
        Unstake
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className={clsx(styles.overlay, {
          [styles.confirmOverlay]:
            dialogState === DialogState.CONFIRM_UNSTAKE ||
            dialogState === DialogState.CONFIRM,
        })} />
        <Dialog.Content
          className={styles.content}
          onInteractOutside={(e: PointerDownOutsideEvent | FocusOutsideEvent) => {
            e.preventDefault();
            e.stopPropagation();
          }}>

          {dialogState === DialogState.INITIAL && <InitialView />}
          {dialogState === DialogState.UNSTAKE && <UnstakeView />}
          {dialogState === DialogState.CONFIRM_UNSTAKE && <ConfirmUnstakeView />}
          {dialogState === DialogState.CONFIRM && <ConfirmView />}
        </Dialog.Content>
      </Dialog.Portal >
    </Dialog.Root >
  )
};