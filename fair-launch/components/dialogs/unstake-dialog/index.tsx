"use client";

import { abi as klimaFairLaunchAbi } from "@abi/klima-fair-launch";
import { StakeData } from "@components/tables/stakes";
import klimav1Logo from "@public/tokens/klima-v1.svg";
import { useChainModal } from "@rainbow-me/rainbowkit";
import { useForm } from "@tanstack/react-form";
import { FAIR_LAUNCH_CONTRACT_ADDRESS } from "@utils/constants";
import { calculateUnstakePenalty } from "@utils/contract";
import { formatNumber, truncateAddress } from "@utils/formatting";
import clsx from "clsx";
import sumBy from "lodash/sumBy";
import Image from "next/image";
import Link from "next/link";
import { Dialog } from "radix-ui";
import type { FC } from "react";
import { useEffect, useState } from "react";
import { MdAccountBalance, MdWarningAmber } from "react-icons/md";
import { formatUnits, parseUnits } from "viem";
import { baseSepolia } from "viem/chains";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import * as styles from "./styles";

type FocusOutsideEvent = CustomEvent<{ originalEvent: FocusEvent }>;
type PointerDownOutsideEvent = CustomEvent<{ originalEvent: PointerEvent }>;

type Props = {
  startTimestamp: string;
  totalStaked: number;
  stakes: StakeData[];
};

enum DialogState {
  INITIAL,
  UNSTAKE,
  CONFIRM_UNSTAKE,
  CONFIRM,
}

export const UnstakeDialog: FC<Props> = ({
  startTimestamp,
  totalStaked,
  stakes,
}) => {
  const [open, setOpen] = useState(false);
  const { openChainModal } = useChainModal();
  const stakedBalance = formatUnits(BigInt(totalStaked) ?? BigInt(0), 9);
  const [dialogState, setDialogState] = useState(DialogState.INITIAL);

  const form = useForm({
    defaultValues: {
      "burn-amount": "0",
      "receive-amount": "0",
      "unstake-amount": "1",
    },
  });

  const {
    error,
    data: unstakeData,
    isPending: isUnstakePending,
    writeContract: unstakeContract,
  } = useWriteContract();

  const { data: submitReceipt, isSuccess } = useWaitForTransactionReceipt({
    confirmations: 3,
    hash: unstakeData,
  });

  const isTransactionSuccess = isUnstakePending || (unstakeData && !isSuccess);

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
    const unstakeAmount = form.getFieldValue("unstake-amount");
    unstakeContract({
      abi: klimaFairLaunchAbi,
      functionName: "unstake",
      address: FAIR_LAUNCH_CONTRACT_ADDRESS,
      args: [parseUnits(unstakeAmount, 9)],
      chainId: baseSepolia.id,
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
    if (Number(amount) <= 0) return;

    const penalties: {
      stakeIndex: number;
      amountTaken: number;
      burnValue: number;
      receiveAmount: number;
    }[] = [];
    let totalUnstake = 0;
    let totalBurnAmount = 0;
    const userAmount = Number(amount);
    let remainingAmount = userAmount;

    for (let i = 0; i < stakes.length; i++) {
      const stake = stakes[i];
      if (stake.amount === 0) continue;

      const formatted = Number(formatUnits(BigInt(stake.amount), 9));
      const amountToTake = Math.min(formatted, remainingAmount);
      const burnForStake = await calculateUnstakePenalty(
        parseUnits(amountToTake.toString(), 9),
        stake.stakeStartTime.toString()
      );

      totalUnstake += amountToTake;
      totalBurnAmount += Number(burnForStake.burnValue);

      penalties.push({
        stakeIndex: i,
        amountTaken: amountToTake,
        burnValue: Number(burnForStake.burnValue),
        receiveAmount: amountToTake - Number(burnForStake.burnValue),
      });

      remainingAmount -= amountToTake;
      if (remainingAmount <= 0) break;
    }
    form.setFieldValue(
      "burn-amount",
      formatNumber(sumBy(penalties, "burnValue"), 3)
    );
    form.setFieldValue(
      "receive-amount",
      formatNumber(sumBy(penalties, "receiveAmount"), 3)
    );
  };

  const validateInput = (value: string) => {
    if (Number(value) > Number(stakedBalance)) {
      return "You don't have enough staked KLIMA";
    } else if (Number(stakedBalance) <= 0 || Number(value) <= 0) {
      return "Invalid unstake amount";
    } else {
      return undefined;
    }
  };

  useEffect(() => {
    setOpen(false);
    if (submitReceipt?.status === "success") {
      window.localStorage.setItem(
        "unstakeAmount",
        form.getFieldValue("unstake-amount")
      );
      window.location.reload();
    }
  }, [submitReceipt]);

  useEffect(() => {
    if (error?.message.includes("The current chain of the wallet")) {
      openChainModal?.();
      handleDialogState();
    }
  }, [error]);

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
          <Link
            target="_blank"
            href="https://github.com/KlimaDAO/klimadao-docs/blob/main/klima%202.0/KlimaDAO%20-%20Klima%202.0%20-%20Fair%20Launch%20FAQ%20-%20April%201%2C%202025.md#burn-calculation"
          >
            the burn mechanism
          </Link>
          , but you’ll also miss out on KlimaX!
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
    <form.Field
      name="unstake-amount"
      listeners={{
        onMount: async ({ value }) => {
          return await generateAllocationInfo(value);
        },
        onChange: async ({ value }) => {
          return await generateAllocationInfo(value);
        },
      }}
      validators={{
        onMount: ({ value }) => {
          if (Number(value) <= 0) {
            return "Invalid unstake amount";
          }
        },
        onChange: ({ value }) => {
          return validateInput(value);
        },
      }}
    >
      {(field) => (
        <div className={styles.content}>
          <div className={styles.icon}>
            <MdAccountBalance />
          </div>
          <Dialog.Title className={styles.title}>Unstake</Dialog.Title>
          <div className={styles.description}>
            <div className={styles.inputContainer}>
              <>
                <div className={styles.row}>
                  <label htmlFor={field.name}>Amount</label>
                  <div className={styles.availableBalance}>
                    Available: {formatNumber(Number(stakedBalance), 3)}
                  </div>
                </div>
                <div
                  className={styles.inputRow(!!field.state.meta.errors.length)}
                >
                  <Image
                    className={styles.klimaLogo}
                    src={klimav1Logo}
                    alt="Klima V1 Logo"
                  />
                  <input
                    type="number"
                    id={field.name}
                    min="0"
                    max={stakedBalance}
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
                {field.state.meta.errors ? (
                  <div className={styles.errorText} role="alert">
                    {field.state.meta.errors.join(", ")}
                  </div>
                ) : null}
              </>
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
            <button
              className={clsx(styles.primaryButton, {
                [styles.disabled]: !!field.state.meta.errors.length,
              })}
              onClick={handleUnstake}
              disabled={!!field.state.meta.errors.length}
            >
              Unstake
            </button>
            <Dialog.Close asChild>
              <button className={styles.secondaryButton}>Cancel</button>
            </Dialog.Close>
          </div>
        </div>
      )}
    </form.Field>
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
            <Link
              target="_blank"
              href="https://github.com/KlimaDAO/klimadao-docs/blob/main/klima%202.0/KlimaDAO%20-%20Klima%202.0%20-%20Fair%20Launch%20FAQ%20-%20April%201%2C%202025.md#burn-calculation"
            >
              Learn more about burning KLIMA.
            </Link>
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
