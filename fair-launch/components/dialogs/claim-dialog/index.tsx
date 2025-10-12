"use client";

import { abi as klimaFairLaunchClaimAbi } from "@abi/klima-fair-launch-claim";
import { useChainModal } from "@rainbow-me/rainbowkit";
import { getConfig, URLS } from "@utils/constants";
import { truncateAddress } from "@utils/formatting";
import clsx from "clsx";
import Link from "next/link";
import { Dialog } from "radix-ui";
import { type FC, useEffect, useState } from "react";
import { BsArrowRightShort } from "react-icons/bs";
import { MdOutlineRocketLaunch } from "react-icons/md";
import { RiExternalLinkLine } from "react-icons/ri";
import { css } from "styled-system/css";
import { parseUnits } from "viem";
import {
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import * as styles from "./styles";

type InteractOutsideEvent =
  | CustomEvent<{ originalEvent: FocusEvent }>
  | CustomEvent<{ originalEvent: PointerEvent }>;

enum DialogState {
  INITIAL,
  CONFIRM,
  SUCCESS,
}

type Props = {
  klimaDeposited: string;
  isKvcmClaimEnabled: boolean;
  userClaimableAmount: string;
};

export const ClaimDialog: FC<Props> = ({
  klimaDeposited,
  isKvcmClaimEnabled,
  userClaimableAmount,
}) => {
  const config = getConfig();
  const [open, setOpen] = useState(false);
  const { openChainModal } = useChainModal();
  const [dialogState, setDialogState] = useState(DialogState.INITIAL);

  const {
    data: stakeData,
    error: stakeError,
    isPending: isStakePending,
    writeContract: stakeContract,
  } = useWriteContract();

  const { data: submitReceipt, isError } = useWaitForTransactionReceipt({
    confirmations: 3,
    hash: stakeData,
  });
  const isSubmitSuccess = submitReceipt?.status === "success";
  const isTransactionSuccess = isStakePending || (stakeData && isSubmitSuccess);

  const handleDialogState = () => {
    setOpen(!open);
    // reset dialog state when dialog is closed
    if (open) setDialogState(DialogState.INITIAL);
  };

  const handleProceed = () => {
    setDialogState(DialogState.CONFIRM);
  };

  const handleConfirm = async () => {
    stakeContract({
      abi: klimaFairLaunchClaimAbi,
      functionName: "claimKvcm",
      address: config.fairLaunchClaimContractAddress,
      args: [parseUnits(klimaDeposited, 9)],
      chainId: config.chain,
    });
  };

  useEffect(() => {
    setOpen(false);
    if (submitReceipt?.status === "success") {
      setDialogState(DialogState.SUCCESS);
    }
  }, [submitReceipt]);

  useEffect(() => {
    if (stakeError?.message.includes("The current chain of the wallet")) {
      openChainModal?.();
      handleDialogState();
    }
  }, [stakeError]);

  const InitialView = () => (
    <>
      <div className={styles.icon}>
        <MdOutlineRocketLaunch />
      </div>
      <Dialog.Title className={styles.title}>Claim your rewards</Dialog.Title>
      <Dialog.Description className={styles.description}>
        <div className={styles.descriptionItem}>
          KLIMA Deposited
          <span>{klimaDeposited}</span>
        </div>
        <div className={styles.descriptionItem}>
          Claimable kVCM <span>{userClaimableAmount} kVCM</span>
        </div>
        <div className={clsx(styles.descriptionItem, styles.tgeInfo)}>
          K2 allocation vesting starts on protocol launch.
        </div>
        <div className={styles.descriptionItem}>
          <Link target="_blank" href={URLS.tgeDocs} className={styles.link}>
            Read TGE docs
          </Link>
        </div>
      </Dialog.Description>
      <div className={styles.actions}>
        <button className={styles.primaryButton} onClick={handleProceed}>
          Claim kVCM
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
            {truncateAddress(config.fairLaunchContractAddress)}
          </div>
        </div>
        <div className={styles.inputContainer}>
          <label htmlFor="confirm-send-amount">You are receiving</label>
          <div id="confirm-send-amount" className={styles.input}>
            <div>{`${userClaimableAmount} kVCM`}</div>
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
        <button onClick={() => setDialogState(DialogState.SUCCESS)}>
          Success
        </button>
        <Dialog.Close asChild>
          <button className={styles.secondaryButton}>Cancel</button>
        </Dialog.Close>
      </div>
    </>
  );

  const SuccessView = () => (
    <>
      <div className={styles.icon}>
        <MdOutlineRocketLaunch />
      </div>
      <Dialog.Title className={styles.title}>
        Successfully claimed {userClaimableAmount} kVCM
      </Dialog.Title>
      <Dialog.Description className={styles.description}>
        <div className={css({ textAlign: "center" })}>
          K2 vesting will begin at protocol launch; we'll announce timing.
        </div>
        <div className={styles.txInfo}>
          <span>TX Confirmed</span>
          <span>·</span>
          <Link target="_blank" href="#" className={styles.txLink}>
            View on explorer
            <RiExternalLinkLine />
          </Link>
        </div>
        <div className={styles.aerodrome}>
          <div className={styles.aerodromeTitle}>
            <BsArrowRightShort />
            Next step
          </div>
          <div className={styles.nextSteps}>
            Provide liquidity with kVCM on Aerodrome to earn fees/rewards.
          </div>
          <Link
            href={URLS.aerodrome}
            target="_blank"
            className={clsx(
              styles.primaryButton,
              styles.aerodromeButtons,
              css({ color: "white !important" })
            )}
          >
            Open Aerodrome
            <RiExternalLinkLine />
          </Link>
          <Link
            href={URLS.tgeDocs}
            target="_blank"
            className={clsx(
              styles.secondaryButton,
              styles.aerodromeButtons,
              css({ color: "void.80" })
            )}
          >
            Read TGE Docs
            <RiExternalLinkLine />
          </Link>
          <span className={styles.disclaimerText}>Not investment advice</span>
        </div>
      </Dialog.Description>
      <div className={styles.actions}>
        <Dialog.Close asChild>
          <button className={styles.secondaryButton}>Done</button>
        </Dialog.Close>
      </div>
    </>
  );

  return (
    <Dialog.Root open={open} onOpenChange={handleDialogState}>
      {isKvcmClaimEnabled ? (
        <Dialog.Trigger className={styles.participateButton}>
          <MdOutlineRocketLaunch />
          Claim kVCM
        </Dialog.Trigger>
      ) : (
        <div className={clsx(styles.participateButton, styles.closedButton)}>
          <MdOutlineRocketLaunch />
          Staking closed. Claim coming soon.
        </div>
      )}
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content
          className={styles.content}
          onInteractOutside={(e: InteractOutsideEvent) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {dialogState === DialogState.INITIAL && <InitialView />}
          {dialogState === DialogState.CONFIRM && <ConfirmView />}
          {dialogState === DialogState.SUCCESS && <SuccessView />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
