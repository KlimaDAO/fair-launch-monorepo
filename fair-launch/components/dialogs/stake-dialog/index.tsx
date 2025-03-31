"use client";

import clsx from "clsx";
import { abi as erc20Abi } from "@abi/erc20";
import { abi as klimaFairLaunchAbi } from "@abi/klima-fair-launch";
import { Alert } from "@components/alert";
import { useForm } from "@tanstack/react-form";
import Image from "next/image";
import {
  FAIR_LAUNCH_CONTRACT_ADDRESS,
  KLIMA_V0_TOKEN_ADDRESS,
} from "@utils/constants";
import klimav1Logo from "@public/tokens/klima-v1.svg";
import { formatNumber, truncateAddress } from "@utils/formatting";
import { Dialog } from "radix-ui";
import { type FC, useEffect, useState } from "react";
import { MdCelebration, MdLibraryAdd } from "react-icons/md";
import { useRouter } from "next/navigation";
import { formatUnits, parseUnits } from "viem";
// import { revalidatePathAction } from "@actions/revalidate-path";
import {
  useAccount,
  useBalance,
  useEstimateGas,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import * as styles from "./styles";

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

  const { data: gasPrice } = useEstimateGas();
  const form = useForm({ defaultValues: { "stake-amount": "0" } });
  const klimaBalance = formatUnits(balance?.value ?? BigInt(0), 9);

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
    writeContract: stakeContract,
  } = useWriteContract();

  const { data: allowanceData } = useReadContract({
    ...allowanceConfig,
    args: [address, FAIR_LAUNCH_CONTRACT_ADDRESS],
  });

  const { data: receipt, isError: isApproveError } = useWaitForTransactionReceipt({ hash: approveData });
  const isApproved = receipt?.status === "success";
  const isApprovalSuccess = isApprovePending || (approveData && !isApproved);

  const { data: submitReceipt, isError, isSuccess } = useWaitForTransactionReceipt({
    confirmations: 3,
    hash: stakeData,
  });
  const isSubmitSuccess = receipt?.status === "success";
  const isTransactionSuccess = isStakePending || (stakeData && isSubmitSuccess);

  // console.log('isSuccess', isSuccess);
  // console.log('isSubmitSuccess', isSubmitSuccess);

  const handleDialogState = () => {
    setOpen(!open);
    // reset dialog state when dialog is closed
    if (open) {
      setDialogState(DialogState.INITIAL);
      form.reset();
    }
  };

  const handleProceed = () => {
    setDialogState(DialogState.STAKE);
  };

  const handleStake = () => {
    const stakeAmount = form.state.values["stake-amount"];
    if (Number(formatUnits(allowanceData as bigint, 9)) < Number(stakeAmount)) {
      setDialogState(DialogState.APPROVE);
    } else {
      setDialogState(DialogState.CONFIRM);
    }
  };

  const handleApprove = async () => {
    const stakeAmount = form.state.values["stake-amount"];
    approveContract({
      abi: erc20Abi,
      functionName: "approve",
      address: KLIMA_V0_TOKEN_ADDRESS,
      args: [FAIR_LAUNCH_CONTRACT_ADDRESS, parseUnits(stakeAmount, 9)],
    });
  };

  const handleConfirm = async () => {
    const stakeAmount = form.state.values["stake-amount"];
    stakeContract({
      abi: klimaFairLaunchAbi,
      functionName: "stake",
      address: FAIR_LAUNCH_CONTRACT_ADDRESS,
      args: [parseUnits(stakeAmount, 9)],
      gasPrice: gasPrice,
    });
  };

  useEffect(() => {
    if (!!isApproved) setDialogState(DialogState.CONFIRM);
  }, [isApproved]);

  useEffect(() => {
    setOpen(false);
    if (submitReceipt?.status === "success") {
      // revalidatePathAction('/my-rewards');
      window.localStorage.setItem('stakeAmount', form.state.values["stake-amount"] as string);
      setTimeout(() => window.location.reload(), 1);
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
      <form.Field
        name="stake-amount"
        validators={{
          onChange: ({ value }) => {
            if (Number(value) > Number(klimaBalance)) {
              return "You don't have enough KLIMA";
            } else if (Number(klimaBalance) <= 0 || Number(value) <= 0) {
              return "Invalid unstake amount";
            } else {
              return undefined;
            }
          }
        }}
      >
        {(field) => (
          <>
            <div className={styles.icon}>
              <MdLibraryAdd />
            </div>
            <Dialog.Title className={styles.title}>Stake KLIMA</Dialog.Title>
            <div className={styles.description}>
              <div className={styles.inputContainer}>
                <>
                  <div className={styles.row}>
                    <label htmlFor={field.name}>Amount</label>
                    <div className={styles.availableBalance}>
                      Available: {formatNumber(Number(klimaBalance), 3)}
                    </div>
                  </div>
                  <div className={
                    clsx(styles.inputRow(!!field.state.meta.errors.length))
                  }>
                    <Image className={styles.klimaLogo} src={klimav1Logo} alt="Klima V1 Logo" />
                    <input
                      type="number"
                      id={field.name}
                      name={field.name}
                      min="0"
                      max={klimaBalance}
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
                </>
                {field.state.meta.errors ? (
                  <div className={styles.errorText} role="alert">
                    {field.state.meta.errors.join(', ')}
                  </div>
                ) : null}
              </div>
            </div>
            <Alert variant="default">
              <strong>Note:</strong> It is best to leave this amount staked until the
              end of the Fair Launch period. Unstaking your KLIMA early will result in
              a penalty.
            </Alert>
            <div className={styles.actions}>
              <button
                onClick={handleStake}
                disabled={!!field.state.meta.errors.length}
                className={clsx(styles.primaryButton, {
                  [styles.disabled]: !!field.state.meta.errors.length,
                })}
              >
                Stake
              </button>
              <Dialog.Close asChild>
                <button className={styles.secondaryButton}>Cancel</button>
              </Dialog.Close>
            </div>
          </>
        )}
      </form.Field>
    </>
  );

  const ApproveView = () => (
    <>
      <div className={styles.confirmContainer}>
        <Dialog.Title className={styles.confirmTitle}>
          Confirm your transaction
        </Dialog.Title>
        <Dialog.Description className={styles.confirmDescription}>
          To complete this transaction, please allow our smart contract to
          transfer tokens on your behalf.
        </Dialog.Description>
      </div>
      <div className={styles.description}>
        <div className={styles.inputContainer}>
          <label htmlFor="approve-contract-address">Contract Address</label>
          <div id="approve-contract-address" className={styles.input}>
            {truncateAddress(FAIR_LAUNCH_CONTRACT_ADDRESS)}
          </div>
        </div>
        <div className={styles.inputContainer}>
          <label htmlFor="approve-send-amount">You are sending</label>
          <div id="approve-send-amount" className={styles.input}>
            <Image src={klimav1Logo} alt="Klima V1 Logo" />
            <div>{`${formatNumber(
              Number(form.state.values["stake-amount"])
            )} KLIMA`}</div>
          </div>
        </div>
      </div>
      {isApproveError && (
        <div className={styles.errorText} role="alert">
          ❌ Error: something went wrong...
        </div>
      )}
      <div className={styles.actions}>
        <button
          onClick={handleApprove}
          disabled={isApprovalSuccess}
          className={clsx(styles.primaryButton, {
            [styles.disabled]: isApprovalSuccess,
          })}
        >
          {isApprovalSuccess ? "Approving ..." : "Approve"}
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
          <label htmlFor="confirm-contract-address">Contract Address</label>
          <div id="confirm-contract-address" className={styles.input}>
            {truncateAddress(FAIR_LAUNCH_CONTRACT_ADDRESS)}
          </div>
        </div>
        <div className={styles.inputContainer}>
          <label htmlFor="confirm-send-amount">You are sending</label>
          <div id="confirm-send-amount" className={styles.input}>
            <Image src={klimav1Logo} alt="Klima V1 Logo" />
            <div>{`${formatNumber(
              Number(form.state.values["stake-amount"])
            )} KLIMA`}</div>
          </div>
        </div>
      </div>
      {isError && (
        <div className={styles.errorText} role="alert">
          ❌ Error: something went wrong...
        </div>
      )}
      <div className={styles.actions}>
        <button
          onClick={handleConfirm}
          disabled={isTransactionSuccess && !isError}
          className={clsx(styles.primaryButton, {
            [styles.disabled]: isTransactionSuccess && !isError,
          })}
        >
          {isTransactionSuccess && !isError ? "Submitting ..." : "Submit"}
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
