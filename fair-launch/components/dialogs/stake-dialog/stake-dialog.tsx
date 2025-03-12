'use client';

import clsx from 'clsx';
import type { FC } from "react";
import { Alert } from "@components/alert/alert";
import { Input } from "@components/input/input";
import { Dialog } from "radix-ui";
import { parseEther } from 'viem'
import { abi as erc20Abi } from '@abi/erc20';
import { abi as klimaFairLaunchAbi } from '@abi/klima-fair-launch';
import { Fragment, useEffect, useState } from "react";
import { MdCelebration, MdLibraryAdd } from "react-icons/md";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import * as styles from './stake-dialog.styles';

type FocusOutsideEvent = CustomEvent<{ originalEvent: FocusEvent }>;
type PointerDownOutsideEvent = CustomEvent<{ originalEvent: PointerEvent }>;

// TODO - move to constants...
const contractAddress = '0x5D7c2a994Ca46c2c12a605699E65dcbafDeae80c';
const klimaTokenAddress = '0x3E63e9c64942399e987A04f0663A5c1Cba9c148A';

const allowanceConfig = {
  abi: erc20Abi,
  functionName: 'allowance',
  address: klimaTokenAddress,
} as const;

enum DialogState {
  INITIAL,
  STAKE,
  APPROVE,
  CONFIRM,
}

export const StakeDialog: FC = () => {
  const { address } = useAccount();
  const [dialogState, setDialogState] = useState<DialogState>(DialogState.INITIAL);

  const { data: stakeData, writeContract: stakeContract } = useWriteContract()
  const { data: approveData, writeContract: approveContract, isPending: isApprovePending } = useWriteContract();
  const { data: allowanceData } = useReadContract({
    ...allowanceConfig, args: [address, contractAddress],
  });

  // Use the hook to wait for the transaction receipt only if transactionHash is set
  const { data: receipt } = useWaitForTransactionReceipt({ hash: approveData });
  const isApproved = receipt?.status === 'success';

  console.log('|---isApproved---|', isApproved);

  const handleProceed = () => {
    setDialogState(DialogState.STAKE);
  };

  const handleStake = () => {
    setDialogState(DialogState.APPROVE);
  };

  const handleApprove = () => {
    approveContract({
      abi: erc20Abi,
      functionName: 'approve',
      address: klimaTokenAddress,
      args: [contractAddress, parseEther('10')],
    });
  };

  const handStake = () => {
    stakeContract({
      abi: klimaFairLaunchAbi,
      functionName: 'stake',
      address: contractAddress,
      args: [parseEther('0.00000000000000005')],
    });
  }

  useEffect(() => {
    if (!!isApproved) {
      setDialogState(DialogState.CONFIRM);
    }
  }, [isApproved]);

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
          <button
            className={styles.primaryButton}
            onClick={handleProceed}
          >
            Proceed
          </button>
          <Dialog.Close asChild>
            <button className={styles.secondaryButton}>
              Cancel
            </button>
          </Dialog.Close>
        </div>
      </Fragment>
    )
  }

  const StakeView = () => {
    return (
      <Fragment>
        <div className={styles.icon}>
          <MdLibraryAdd />
        </div>
        <Dialog.Title className={styles.title}>
          Stake KLIMA
        </Dialog.Title>
        <div className={styles.description}>
          <div className={styles.inputContainer}>
            <label htmlFor="stake-amount">
              Amount
            </label>
            <Input id="stake-amount" placeholder="0.00" />
          </div>
          <Alert variant="default">
            <strong>Note:</strong>{' '}
            It is best to leave this amount staked until the end of the Fair Launch period. Unstaking your KLIMA early will result in a penalty.
          </Alert>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.primaryButton}
            onClick={handleStake}>
            Stake
          </button>
          <Dialog.Close asChild>
            <button className={styles.secondaryButton}>
              Cancel
            </button>
          </Dialog.Close>
        </div>
      </Fragment>
    )
  }

  const ApproveView = () => {
    return (
      <Fragment>
        <div className={styles.icon}>
          <MdLibraryAdd />
        </div>
        <Dialog.Title className={styles.title}>
          Stake KLIMA
        </Dialog.Title>
        <Dialog.Description className={styles.description}>
          To complete this transaction, please allow our smart contract to transfer tokens on your behalf.
        </Dialog.Description>
        <div className={styles.description}>
          <div className={styles.inputContainer}>
            <label htmlFor="contract-address">
              Contract Address
            </label>
            <Input disabled id="contract-address" value="0x8cE...5f8" />
          </div>
          <div className={styles.inputContainer}>
            <label htmlFor="send-amount">
              You are sending
            </label>
            <Input disabled id="send-amount" value="25.00 KLIMA" />
          </div>
        </div>
        <div className={styles.actions}>
          <button
            disabled={isApprovePending || (approveData && !isApproved)}
            className={clsx(styles.primaryButton, {
              [styles.disabled]: isApprovePending || (approveData && !isApproved),
            })}
            onClick={handleApprove}>
            Approve
          </button>
          <Dialog.Close asChild>
            <button className={styles.secondaryButton}>
              Cancel
            </button>
          </Dialog.Close>
        </div>
      </Fragment>
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
          <button
            className={styles.primaryButton}
            onClick={() => {
              handleStake();
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
    )
  }

  return (
    <Dialog.Root>
      <Dialog.Trigger className={styles.fairLaunchButton}>
        <MdCelebration />
        Participate in Klima Fair Launch
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className={clsx(styles.overlay, {
          [styles.confirmOverlay]: dialogState === DialogState.APPROVE || dialogState === DialogState.CONFIRM,
        })} />
        <Dialog.Content
          className={styles.content}
          onInteractOutside={(e: PointerDownOutsideEvent | FocusOutsideEvent) => {
            e.preventDefault();
            e.stopPropagation();
          }}>

          {dialogState === DialogState.INITIAL && (
            <InitialView />
          )}

          {dialogState === DialogState.STAKE && (
            <StakeView />
          )}

          {dialogState === DialogState.APPROVE && (
            <ApproveView />
          )}

          {dialogState === DialogState.CONFIRM && (
            <ConfirmView />
          )}


          {/* 
          {!shouldProceed ? (
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
                <MdLibraryAdd />
              </div>
              <Dialog.Title className={styles.title}>
                Stake KLIMA
              </Dialog.Title>
              <div className={styles.description}>
                <div className={styles.inputContainer}>
                  <label htmlFor="stake-amount">
                    Amount
                  </label>
                  <Input id="stake-amount" placeholder="0.00" />
                </div>
                <Alert variant="default">
                  <strong>Note:</strong>{' '}
                  It is best to leave this amount staked until the end of the Fair Launch period. Unstaking your KLIMA early will result in a penalty.
                </Alert>
              </div>
              <div className={styles.actions}>
                <button
                  className={styles.primaryButton}
                  onClick={handleStake}>
                  Stake
                </button>
                <Dialog.Close asChild>
                  <button className={styles.secondaryButton}>
                    Cancel
                  </button>
                </Dialog.Close>
              </div>
            </>
          )} */}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
};