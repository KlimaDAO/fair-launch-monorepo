"use client";

import { abi as klimaFairLaunchAbi } from "@abi/klima-fair-launch";
import klimav1Logo from "@public/tokens/klima-v1.svg";
import { useForm } from "@tanstack/react-form";
import { FAIR_LAUNCH_CONTRACT_ADDRESS } from "@utils/constants";
import { calculateUnstakePenalty } from "@utils/contract";
import {
  formatNumber,
  formatTokenToValue,
  truncateAddress,
} from "@utils/formatting";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { Dialog } from "radix-ui";
import type { FC } from "react";
import { useEffect, useState } from "react";
import { MdAccountBalance, MdWarningAmber } from "react-icons/md";
import { formatUnits, parseUnits } from "viem";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import * as styles from "./styles";

type FocusOutsideEvent = CustomEvent<{ originalEvent: FocusEvent }>;
type PointerDownOutsideEvent = CustomEvent<{ originalEvent: PointerEvent }>;

interface UnstakeDialogProps {
  amount: string;
  startTimestamp: string;
  totalStaked: number;
}

enum DialogState {
  INITIAL,
  UNSTAKE,
  CONFIRM_UNSTAKE,
  CONFIRM,
}

export const UnstakeDialog: FC<UnstakeDialogProps> = ({
  amount,
  startTimestamp,
  totalStaked,
}) => {
  const [open, setOpen] = useState(false);
  const stakedBalance = formatUnits(BigInt(totalStaked) ?? BigInt(0), 9);
  const [dialogState, setDialogState] = useState(DialogState.INITIAL);
  const { data: unstakeData, isPending: isUnstakePending, writeContract: unstakeContract } =
    useWriteContract();

  const form = useForm({
    defaultValues: {
      "burn-amount": "0",
      "receive-amount": "0",
      "unstake-amount": formatTokenToValue(amount),
    },
  });

  const { data: submitReceipt, isSuccess } = useWaitForTransactionReceipt({
    confirmations: 3,
    hash: unstakeData,
  });

  const isTransactionSuccess = isUnstakePending || (unstakeData && !isSuccess)

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
    const unstakeAmount = form.state.values["unstake-amount"];
    unstakeContract({
      abi: klimaFairLaunchAbi,
      functionName: "unstake",
      address: FAIR_LAUNCH_CONTRACT_ADDRESS,
      args: [parseUnits(unstakeAmount, 9)],
    });
  };

  const handleDialogState = () => {
    setOpen(!open);
    if (open) {
      setDialogState(DialogState.INITIAL);
      form.reset();
    }
  };

  const generateAllocationInfo = async (amount: string) => {
    // todo -> cleanup
    const penalty = await calculateUnstakePenalty(
      parseUnits(amount, 9),
      startTimestamp
    );
    form.setFieldValue("burn-amount", formatNumber(penalty.burnValue, 2));
    form.setFieldValue(
      "receive-amount",
      formatNumber(Number(amount) - Number(penalty.burnValue), 2)
    );
  };

  useEffect(() => {
    setOpen(false);
    // todo - show notification message...
    if (submitReceipt?.status === "success") {
      window.location.reload();
    }
  }, [submitReceipt]);

  const InitialView = () => (
    <>
      <div className={styles.icon}>
        <MdWarningAmber />
      </div>
      <Dialog.Title className={styles.title}>
        Hold on there, partner!
      </Dialog.Title>
      <div className={styles.altDescription}>
        <div>
          The longer you leave your KLIMA staked, the better your rewards! If
          you unstake now, you’ll not only lose out on some KLIMA through{" "}
          <Link href="/">the burn mechanism</Link>, but you’ll also miss out on
          KlimaX!
        </div>
        <div>
          Make sure you have a good reason to unstake before you go clickin’
          buttons.
        </div>
      </div>
      <div className={styles.actions}>
        <button onClick={handleProceed} className={styles.primaryButton}>
          Proceed
        </button>
        <Dialog.Close asChild>
          <button className={styles.secondaryButton}>Cancel</button>
        </Dialog.Close>
      </div>
    </>
  );

  const UnstakeView = () => (
    <div className={styles.content}>
      <div className={styles.icon}>
        <MdAccountBalance />
      </div>
      <Dialog.Title className={styles.title}>Unstake</Dialog.Title>
      <div className={styles.description}>
        <div className={styles.inputContainer}>
          <form.Field
            name="unstake-amount"
            listeners={{
              onMount: async ({ value }) => await generateAllocationInfo(value),
              onChange: async ({ value }) =>
                await generateAllocationInfo(value),
            }}
          >
            {(field) => (
              <>
                <label htmlFor={field.name}>Amount</label>
                <div className={styles.inputRow}>
                  <input
                    type="number"
                    id={field.name}
                    name={field.name}
                    className={styles.input}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <button
                    className={styles.maxButton}
                    onClick={() => field.handleChange(stakedBalance)}
                  >
                    Max
                  </button>
                </div>
              </>
            )}
          </form.Field>
        </div>
        <div className={styles.infoRowContainer}>
          <div className={styles.infoRow}>
            <p>Burn Amount</p>
            <form.Field name="burn-amount">
              {(field) => (
                <p>
                  <strong>{field.state.value}</strong> KLIMA
                </p>
              )}
            </form.Field>
          </div>
          <div className={styles.infoRow}>
            <p>Receive Amount</p>
            <form.Field name="receive-amount">
              {(field) => (
                <p>
                  <strong>{field.state.value}</strong> KLIMA
                </p>
              )}
            </form.Field>
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

  const ConfirmUnstakeView = () => (
    <>
      <div className={styles.icon}>
        <MdWarningAmber />
      </div>
      <Dialog.Title className={styles.title}>Confirm Unstake</Dialog.Title>
      <form.Subscribe
        selector={(state) => state.values}
        children={(values) => (
          <div className={styles.altDescription}>
            <div>
              Are you sure you'd like to unstake {values["unstake-amount"]}{" "}
              KLIMA? You will burn {values["burn-amount"]} KLIMA and{" "}
              <strong>will not be able to re-stake it.</strong>
            </div>
            <div>
              You will still get to keep the points and KlimaX you've accrued.
            </div>
            <Link href="/">Learn more about burning KLIMA.</Link>
          </div>
        )}
      />
      <div className={styles.actions}>
        <button onClick={handleConfirmUnstake} className={styles.primaryButton}>
          Confirm
        </button>
        <Dialog.Close asChild>
          <button className={styles.secondaryButton}>Cancel</button>
        </Dialog.Close>
      </div>
    </>
  );

  const ConfirmView = () => (
    <>
      <Dialog.Title className={styles.title}>
        Confirm your transaction
      </Dialog.Title>
      <div className={styles.description}>
        <p>
          Give the transaction one final review before submitting to the
          blockchain.
        </p>
        <div className={styles.inputContainer}>
          <label htmlFor="confirm-unstake-contract-address">
            Contract Address
          </label>
          <div id="confirm-unstake-contract-address" className={styles.input}>
            {truncateAddress(FAIR_LAUNCH_CONTRACT_ADDRESS)}
          </div>
        </div>
        <div className={styles.inputContainer}>
          <label htmlFor="confirm-unstake-amount">You are sending</label>
          <div id="confirm-unstake-amount" className={styles.input}>
            <Image src={klimav1Logo} alt="Klima V1 Logo" />
            <div>{`${formatNumber(
              Number(form.state.values["unstake-amount"])
            )} KLIMA`}</div>
          </div>
        </div>
      </div>
      <div className={styles.actions}>
        <button
          onClick={handleConfirm}
          disabled={isTransactionSuccess}
          className={clsx(styles.primaryButton, {
            [styles.disabled]: isTransactionSuccess,
          })}
        >
          {isTransactionSuccess ? "Submitting ..." : "Submit"}
        </button>
        <Dialog.Close asChild>
          <button className={styles.secondaryButton}>Cancel</button>
        </Dialog.Close>
      </div>
    </>
  );

  return (
    <Dialog.Root open={open} onOpenChange={handleDialogState}>
      <Dialog.Trigger className={styles.unstakeButton}>Unstake</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay
          className={clsx(styles.overlay, {
            [styles.confirmOverlay]:
              dialogState === DialogState.CONFIRM_UNSTAKE ||
              dialogState === DialogState.CONFIRM,
          })}
        />
        <Dialog.Content
          className={styles.content}
          onInteractOutside={(
            e: PointerDownOutsideEvent | FocusOutsideEvent
          ) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {dialogState === DialogState.INITIAL && <InitialView />}
          {dialogState === DialogState.UNSTAKE && <UnstakeView />}
          {dialogState === DialogState.CONFIRM_UNSTAKE && (
            <ConfirmUnstakeView />
          )}
          {dialogState === DialogState.CONFIRM && <ConfirmView />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
