"use client";

import clsx from "clsx";
import { Alert } from "@components/alert";
import { Dialog } from "radix-ui";
import { useForm } from "@tanstack/react-form";
import { formatUnits } from "viem";
import { formatNumber } from "@utils/formatting";
import { abi as erc20Abi } from "@abi/erc20";
import { abi as klimaFairLaunchAbi } from "@abi/klima-fair-launch";
import { MdCelebration, MdLibraryAdd } from "react-icons/md";
import { type FC, useEffect, useState } from "react";
import { KLIMA_V0_TOKEN_ADDRESS, FAIR_LAUNCH_CONTRACT_ADDRESS } from "@utils/constants";
import {
  useAccount,
  useBalance,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import * as styles from "./stake-dialog.styles";

type InteractOutsideEvent =
  | CustomEvent<{ originalEvent: FocusEvent }>
  | CustomEvent<{ originalEvent: PointerEvent }>;

const allowanceConfig = {
  abi: erc20Abi,
  functionName: "allowance",
  address: KLIMA_V0_TOKEN_ADDRESS,
} as const;

enum DialogState {
  INITIAL,
  STAKE,
  APPROVE,
  CONFIRM,
}

export const StakeDialog: FC = () => {
  const { address } = useAccount();
  const { data: balance } = useBalance({
    address: address,
    token: KLIMA_V0_TOKEN_ADDRESS,
  });

  const klimaBalance = formatUnits(balance?.value ?? BigInt(0), 9);
  const form = useForm({
    defaultValues: { 'stake-amount': '' },
    onSubmit: async ({ value }) => {
      console.log('after submit', value);
    },
  });

  const [open, setOpen] = useState(false);
  const [dialogState, setDialogState] = useState(DialogState.INITIAL);

  const {
    data: approveData,
    isPending: isApprovePending,
    writeContract: approveContract,
  } = useWriteContract();

  const {
    data: stakeData,
    isPending: isStakePending,
    isSuccess: isStakeSuccess,
    writeContract: stakeContract,
  } = useWriteContract();

  const { data: allowanceData } = useReadContract({
    ...allowanceConfig,
    args: [address, FAIR_LAUNCH_CONTRACT_ADDRESS],
  });

  const { data: receipt } = useWaitForTransactionReceipt({ hash: approveData });
  const isApproved = receipt?.status === "success";
  const { data: submitReceipt } = useWaitForTransactionReceipt({
    confirmations: 14,
    hash: stakeData,
  });

  const handleDialogState = () => {
    setOpen(!open);
    // reset dialog state when dialog is closed
    if (open) setDialogState(DialogState.INITIAL);
  };

  const handleProceed = () => {
    setDialogState(DialogState.STAKE);
  };

  const handleStake = () => {
    setDialogState(!allowanceData ? DialogState.APPROVE : DialogState.CONFIRM);
  };

  const handleApprove = () => {
    const stakeAmount = form.state.values["stake-amount"];
    approveContract({
      abi: erc20Abi,
      functionName: "approve",
      address: KLIMA_V0_TOKEN_ADDRESS,
      args: [FAIR_LAUNCH_CONTRACT_ADDRESS, BigInt(stakeAmount) * BigInt(10 ** 9)],
    });
  };

  const handleConfirm = () => {
    const stakeAmount = form.state.values["stake-amount"];
    stakeContract({
      abi: klimaFairLaunchAbi,
      functionName: "stake",
      address: FAIR_LAUNCH_CONTRACT_ADDRESS,
      args: [BigInt(stakeAmount) * BigInt(10 ** 9)],
    });
  };

  useEffect(() => {
    if (!!isApproved) setDialogState(DialogState.CONFIRM);
  }, [isApproved]);

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
        <MdLibraryAdd />
      </div>
      <Dialog.Title className={styles.title}>
        Participate in the Fair Launch!
      </Dialog.Title>
      <Dialog.Description className={styles.description}>
        Stake KLIMA to earn your share of KLIMA 2.0!
      </Dialog.Description>
      <div className={styles.actions}>
        <button className={styles.primaryButton} onClick={handleProceed}>
          Proceed
        </button>
        <Dialog.Close asChild>
          <button className={styles.secondaryButton}>Cancel</button>
        </Dialog.Close>
      </div>
    </>
  );

  const StakeView = () => (
    <>
      <div className={styles.icon}>
        <MdLibraryAdd />
      </div>
      <Dialog.Title className={styles.title}>Stake KLIMA</Dialog.Title>
      <div className={styles.description}>
        <div className={styles.inputContainer}>
          <form.Field name="stake-amount">
            {(field) => (
              <>
                <label htmlFor={field.name}>
                  Amount
                </label>
                <div className={styles.inputRow}>
                  <input
                    type="number"
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    className={styles.input}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <button
                    className={styles.maxButton}
                    onClick={() => field.handleChange(klimaBalance)}
                  >
                    Max
                  </button>
                </div>
                {/* {field.state.meta.errors ? (
                    <em role="alert">{field.state.meta.errors.join(', ')}</em>
                  ) : null} */}
              </>
            )}
          </form.Field>
        </div>
      </div>
      <Alert variant="default">
        <strong>Note:</strong> It is best to leave this amount staked until
        the end of the Fair Launch period. Unstaking your KLIMA early will
        result in a penalty.
      </Alert>
      <div className={styles.actions}>
        <button className={styles.primaryButton} onClick={handleStake}>
          Stake
        </button>
        <Dialog.Close asChild>
          <button className={styles.secondaryButton}>Cancel</button>
        </Dialog.Close>
      </div>
    </>
  );

  const ApproveView = () => (
    <>
      <div className={styles.confirmContainer}>
        <Dialog.Title className={styles.confirmTitle}>Confirm your transaction</Dialog.Title>
        <Dialog.Description className={styles.confirmDescription}>
          To complete this transaction, please allow our smart contract to transfer tokens on your behalf.
        </Dialog.Description>
      </div>
      <div className={styles.description}>
        <div className={styles.inputContainer}>
          <label htmlFor="contract-address">Contract Address</label>
          <input className={styles.input} disabled id="contract-address" value="0x8cE...5f8" />
        </div>
        <div className={styles.inputContainer}>
          <label htmlFor="send-amount">You are sending</label>
          <input className={styles.input} disabled id="send-amount" value={`${form.state.values["stake-amount"]} KLIMA`} />
        </div>
      </div>
      <div className={styles.actions}>
        <button
          onClick={handleApprove}
          disabled={isApprovePending || (approveData && !isApproved)}
          className={clsx(styles.primaryButton, {
            [styles.disabled]:
              isApprovePending || (approveData && !isApproved),
          })}
        >
          Approve{" "}
          {isApprovePending || (approveData && !isApproved) ? "..." : ""}
        </button>
        <Dialog.Close asChild>
          <button className={styles.secondaryButton}>Cancel</button>
        </Dialog.Close>
      </div>
    </>
  );

  const ConfirmView = () => (
    <>
      <div className={styles.confirmContainer}>
        <Dialog.Title className={styles.confirmTitle}>
          Confirm your transaction
        </Dialog.Title>
        <Dialog.Description className={styles.confirmDescription}>
          Give the transaction one final review before submitting to the
          blockchain.
        </Dialog.Description>
      </div>
      <div className={styles.description}>
        <div className={styles.inputContainer}>
          <label htmlFor="contract-address">Contract Address</label>
          <input
            disabled
            id="contract-address"
            className={styles.input}
            value="0x8cE...5f8"
          />
        </div>
        <div className={styles.inputContainer}>
          <label htmlFor="send-amount">You are sending</label>
          <input
            disabled
            id="send-amount"
            className={styles.input}
            value={`${formatNumber(Number(form.state.values["stake-amount"]))} KLIMA`}
          />
        </div>
      </div>
      <div className={styles.actions}>
        <button
          onClick={handleConfirm}
          disabled={isStakePending}
          className={clsx(styles.primaryButton, {
            [styles.disabled]: isStakePending,
          })}
        >
          Submit {isStakePending ? "..." : ""}
        </button>
        <Dialog.Close asChild>
          <button className={styles.secondaryButton}>Cancel</button>
        </Dialog.Close>
      </div>
    </>
  );


  return (
    <Dialog.Root open={open} onOpenChange={handleDialogState}>
      <Dialog.Trigger className={styles.participateButton}>
        <MdCelebration />
        Participate in Klima Fair Launch
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay
          className={clsx(styles.overlay, {
            [styles.confirmOverlay]:
              dialogState === DialogState.APPROVE ||
              dialogState === DialogState.CONFIRM,
          })}
        />
        <Dialog.Content
          className={styles.content}
          onInteractOutside={(e: InteractOutsideEvent) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {dialogState === DialogState.INITIAL && <InitialView />}
          {dialogState === DialogState.STAKE && <StakeView />}
          {dialogState === DialogState.APPROVE && <ApproveView />}
          {dialogState === DialogState.CONFIRM && <ConfirmView />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
