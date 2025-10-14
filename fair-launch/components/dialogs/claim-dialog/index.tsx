"use client";

import { abi as klimaFairLaunchClaimAbi } from "@abi/klima-fair-launch-claim";
import { useChainModal } from "@rainbow-me/rainbowkit";
import { getConfig, URLS } from "@utils/constants";
import { truncateAddress } from "@utils/formatting";
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { type FC, useEffect, useState } from "react";
import { BsArrowRightShort } from "react-icons/bs";
import { IoMdCheckmark } from "react-icons/io";
import { MdOutlineRocketLaunch } from "react-icons/md";
import { RiExternalLinkLine } from "react-icons/ri";
import { css } from "styled-system/css";
import {
  useAccount,
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
  hasUserClaimed: boolean;
  klimaDeposited: string;
  isKvcmClaimEnabled: boolean;
  userClaimableAmount: string;
};

export const ClaimDialog: FC<Props> = ({
  hasUserClaimed,
  klimaDeposited,
  isKvcmClaimEnabled,
  userClaimableAmount,
}) => {
  const config = getConfig();
  const router = useRouter();
  const { address } = useAccount();
  const [open, setOpen] = useState(false);
  const { openChainModal } = useChainModal();
  const [isReseting, setIsReseting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogState, setDialogState] = useState(DialogState.INITIAL);

  const {
    data: claimData,
    error: claimError,
    isPending: isClaimPending,
    writeContract: claimContract,
  } = useWriteContract();

  const { data: submitReceipt, isError } = useWaitForTransactionReceipt({
    hash: claimData,
    confirmations: 3,
  });
  const isSubmitSuccess = submitReceipt?.status === "success";
  const isTransactionSuccess =
    isClaimPending || (submitReceipt && isSubmitSuccess);

  const {
    data: resetData,
    error: resetError,
    writeContract: resetContract,
  } = useWriteContract();

  const { data: resetReceipt, isError: isResetError } =
    useWaitForTransactionReceipt({
      hash: resetData,
      confirmations: 3,
    });

  const handleDialogState = () => {
    setOpen(!open);
    // reset dialog state when dialog is closed
    if (open) setDialogState(DialogState.INITIAL);
  };

  const handleProceed = () => {
    setDialogState(DialogState.CONFIRM);
  };

  const handleClaimSuccess = () => {
    router.refresh();
    setOpen(!open);
    // reset dialog state when dialog is closed
    if (open) setDialogState(DialogState.INITIAL);
  };

  useEffect(() => {
    if (isError || claimError) {
      setIsSubmitting(false);
    }
  }, [isError, claimError]);

  useEffect(() => {
    if (isResetError || resetError) {
      setIsReseting(false);
    }
  }, [isResetError, resetError]);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    claimContract({
      abi: klimaFairLaunchClaimAbi,
      functionName: "claimKVCM",
      // @TODO - replace before merging
      address: config.mockFairLaunchClaimContractAddress,
      args: [address],
      chainId: config.chain,
    });
  };

  useEffect(() => {
    if (submitReceipt?.status === "success") {
      setDialogState(DialogState.SUCCESS);
      setIsSubmitting(false);
    }
  }, [submitReceipt]);

  useEffect(() => {
    if (claimError?.message.includes("The current chain of the wallet")) {
      openChainModal?.();
      handleDialogState();
    }
  }, [claimError]);

  // @TODO - remove before merging
  const handleReset = () => {
    setIsReseting(true);
    resetContract({
      abi: klimaFairLaunchClaimAbi,
      functionName: "reset",
      // @TODO - replace before merging
      address: config.mockFairLaunchClaimContractAddress,
      args: [address],
      chainId: config.chain,
    });
  };

  // @TODO - remove before merging
  useEffect(() => {
    if (resetReceipt?.status === "success") {
      router.refresh();
      setIsReseting(false);
      // window.location.reload();
    }
  }, [resetReceipt]);

  if (hasUserClaimed) {
    return (
      <>
        <div
          onClick={handleReset}
          className={clsx(
            styles.participateButton,
            styles.aerodromeButtons,
            css({
              cursor: isReseting ? "not-allowed" : "pointer",
              opacity: isReseting ? 0.45 : 1,
              minWidth: "12rem !important",
            })
          )}
        >
          <IoMdCheckmark />
          {isReseting ? "Resetting ..." : "Reset"}
        </div>
        <div
          className={clsx(
            styles.participateButton,
            styles.closedButton,
            css({ cursor: "not-allowed", minWidth: "12rem !important" })
          )}
        >
          <IoMdCheckmark />
          Claimed
        </div>
      </>
    );
  }

  const InitialView = () => (
    <>
      <div className={styles.icon}>
        <MdOutlineRocketLaunch />
      </div>
      <Dialog.Title className={styles.title}>Claim your rewards</Dialog.Title>
      <div className={styles.description}>
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
      </div>
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
      {!isError || !claimError ? (
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
                {truncateAddress(config.mockFairLaunchClaimContractAddress)}
                {/* @TODO - replace before merging */}
                {/* {truncateAddress(config.fairLaunchClaimContractAddress)} */}
              </div>
            </div>
            <div className={styles.inputContainer}>
              <label htmlFor="confirm-send-amount">You are receiving</label>
              <div id="confirm-send-amount" className={styles.input}>
                <div>{`${userClaimableAmount} kVCM`}</div>
              </div>
            </div>
          </div>
          <div className={styles.actions}>
            <button
              onClick={handleConfirm}
              disabled={isSubmitting && !isError}
              className={clsx(styles.primaryButton, {
                [styles.disabled]: isTransactionSuccess && !isError,
              })}
            >
              {isSubmitting && !isError ? "Submitting ..." : "Submit"}
            </button>
            <Dialog.Close asChild>
              <button className={styles.secondaryButton}>Cancel</button>
            </Dialog.Close>
          </div>
        </>
      ) : (
        <>
          <div className={styles.confirmContainer}>
            <div className={clsx(styles.icon, styles.errorIcon)}>
              <MdOutlineRocketLaunch />
            </div>
            <Dialog.Title className={styles.title}>Claim Failed</Dialog.Title>
          </div>
          <div className={styles.description}>
            <div className={styles.errorBox} role="alert">
              Claim failed. <br />
              Please retry. If it persists, reach us on Discord.
            </div>
          </div>
          <div className={styles.actions}>
            <button
              onClick={() => setDialogState(DialogState.INITIAL)}
              className={clsx(
                styles.primaryButton,
                styles.aerodromeButtons,
                css({ color: "white !important" })
              )}
            >
              Retry
            </button>
            <Link
              href={URLS.discord}
              target="_blank"
              className={clsx(
                styles.secondaryButton,
                styles.aerodromeButtons,
                css({ color: "void.80" })
              )}
            >
              Open Discord
              <RiExternalLinkLine />
            </Link>
            <Dialog.Close asChild>
              <button
                className={css({
                  fontSize: "1.4rem",
                  fontWeight: 500,
                  cursor: "pointer",
                })}
              >
                Cancel
              </button>
            </Dialog.Close>
          </div>
        </>
      )}
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
      <div className={styles.description}>
        <div className={css({ textAlign: "center" })}>
          K2 vesting will begin at protocol launch; we'll announce timing.
        </div>
        <div className={styles.txInfo}>
          <span>TX Confirmed</span>
          <span>·</span>
          <Link
            target="_blank"
            className={styles.txLink}
            href={`https://basescan.org/tx/${submitReceipt?.transactionHash}`}
          >
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
      </div>
      <div className={styles.actions}>
        <Dialog.Close asChild>
          <button
            onClick={handleClaimSuccess}
            className={styles.secondaryButton}
          >
            Done
          </button>
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
