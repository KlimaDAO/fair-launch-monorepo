"use client";

import clsx from "clsx";
import { Alert } from "@components/alert";
import { Input } from "@components/input";
import { Dialog } from "radix-ui";
import { abi as erc20Abi } from "@abi/erc20";
import { formatNumber } from "@utils/formatting";
import { abi as klimaFairLaunchAbi } from "@abi/klima-fair-launch";
import { MdCelebration, MdLibraryAdd } from "react-icons/md";
import { type FC, Fragment, useEffect, useState } from "react";
import { KLIMA_V0_TOKEN_ADDRESS, FAIR_LAUNCH_CONTRACT_ADDRESS } from "@utils/constants";
import {
  useAccount,
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
  const [open, setOpen] = useState(false);
  const [stakeAmount, setStakeAmount] = useState<string>("");
  const [dialogState, setDialogState] = useState<DialogState>(
    DialogState.INITIAL
  );
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

  const handleProceed = () => {
    setDialogState(DialogState.STAKE);
  };

  const handleStake = () => {
    setDialogState(!allowanceData ? DialogState.APPROVE : DialogState.CONFIRM);
  };

  const handleApprove = () => {
    approveContract({
      abi: erc20Abi,
      functionName: "approve",
      address: KLIMA_V0_TOKEN_ADDRESS,
      args: [FAIR_LAUNCH_CONTRACT_ADDRESS, BigInt(stakeAmount)],
    });
  };

  const handleConfirm = () => {
    stakeContract({
      abi: klimaFairLaunchAbi,
      functionName: "stake",
      address: FAIR_LAUNCH_CONTRACT_ADDRESS,
      args: [BigInt(stakeAmount)],
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Input value:", e.target.value);
    setStakeAmount(e.target.value);
  };

  useEffect(() => {
    if (!!isApproved) setDialogState(DialogState.CONFIRM);
  }, [isApproved]);

  console.log("submitReceipt", submitReceipt);

  useEffect(() => {
    if (submitReceipt?.status === "success") {
      setOpen(false);
      // todo - show notification message...
      window.location.reload();
    }
  }, [submitReceipt]);

  const InitialView = () => {
    return (
      <Fragment>
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
      </Fragment>
    );
  };

  const StakeView = () => {
    return (
      <form>
        <div className={styles.icon}>
          <MdLibraryAdd />
        </div>
        <Dialog.Title className={styles.title}>Stake KLIMA</Dialog.Title>
        <div className={styles.description}>
          <div className={styles.inputContainer}>
            <label htmlFor="stake-amount">Amount</label>
            <input
              id="stake-amount"
              value={stakeAmount}
              placeholder={stakeAmount}
              onChange={handleChange}
            />
          </div>
          <Alert variant="default">
            <strong>Note:</strong> It is best to leave this amount staked until
            the end of the Fair Launch period. Unstaking your KLIMA early will
            result in a penalty.
          </Alert>
        </div>
        <div className={styles.actions}>
          <button className={styles.primaryButton} onClick={handleStake}>
            Stake
          </button>
          <Dialog.Close asChild>
            <button className={styles.secondaryButton}>Cancel</button>
          </Dialog.Close>
        </div>
      </form>
    );
  };

  const ApproveView = () => {
    return (
      <Fragment>
        <div className={styles.icon}>
          <MdLibraryAdd />
        </div>
        <Dialog.Title className={styles.title}>Stake KLIMA</Dialog.Title>
        <Dialog.Description className={styles.description}>
          To complete this transaction, please allow our smart contract to
          transfer tokens on your behalf.
        </Dialog.Description>
        <div className={styles.description}>
          <div className={styles.inputContainer}>
            <label htmlFor="contract-address">Contract Address</label>
            <Input disabled id="contract-address" value="0x8cE...5f8" />
          </div>
          <div className={styles.inputContainer}>
            <label htmlFor="send-amount">You are sending</label>
            <Input disabled id="send-amount" value={`${stakeAmount} KLIMA`} />
          </div>
        </div>
        <div className={styles.actions}>
          <button
            disabled={isApprovePending || (approveData && !isApproved)}
            className={clsx(styles.primaryButton, {
              [styles.disabled]:
                isApprovePending || (approveData && !isApproved),
            })}
            onClick={handleApprove}
          >
            Approve{" "}
            {isApprovePending || (approveData && !isApproved) ? "..." : ""}
          </button>
          <Dialog.Close asChild>
            <button className={styles.secondaryButton}>Cancel</button>
          </Dialog.Close>
        </div>
      </Fragment>
    );
  };

  const ConfirmView = () => {
    return (
      <>
        <Dialog.Title className={styles.title}>
          Confirm your transaction
        </Dialog.Title>
        <Dialog.Description className={styles.description}>
          Give the transaction one final review before submitting to the
          blockchain.
        </Dialog.Description>
        <div className={styles.description}>
          <div className={styles.inputContainer}>
            <label htmlFor="contract-address">Contract Address</label>
            <Input disabled id="contract-address" value="0x8cE...5f8" />
          </div>
          <div className={styles.inputContainer}>
            <label htmlFor="send-amount">You are sending</label>
            <Input
              disabled
              id="send-amount"
              value={`${formatNumber(Number(stakeAmount))} KLIMA`}
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
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
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
