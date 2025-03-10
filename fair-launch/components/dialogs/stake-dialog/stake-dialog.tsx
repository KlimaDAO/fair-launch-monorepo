'use client';

import clsx from 'clsx';
import type { FC } from "react";
import { Alert } from "../../alert/alert";
import { Input } from "../../input/input";
import { Dialog } from "radix-ui";
import { useState } from "react";
import { parseEther } from 'viem'
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { MdCelebration, MdLibraryAdd } from "react-icons/md";
import { abi } from '../../../abi/klima-fair-launch';
import { abi as erc20Abi } from '../../../abi/erc20';
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

export const StakeDialog: FC = () => {
  const { address } = useAccount();
  const [shouldProceed, setShouldProceed] = useState(false);
  const [confirmScreen, setConfirmScreen] = useState(false);
  const { data: stakeData, writeContract: stakeContract } = useWriteContract()
  const { data: approveData, writeContract: approveContract } = useWriteContract();
  const { data: allowanceData } = useReadContract({
    ...allowanceConfig, args: [address, contractAddress],
  });

  console.log('|---allowanceData---|', allowanceData);

  const approve = async () => {
    await approveContract({
      abi: erc20Abi,
      functionName: 'approve',
      address: klimaTokenAddress,
      args: [contractAddress, parseEther('10')],
    });
  };

  const stake = async () => {
    await stakeContract({
      abi,
      functionName: 'stake',
      address: contractAddress,
      args: [parseEther('0.00000000000000005')],
    });
  };

  const handleStake = async () => {
    // approve the contract to spend the KLIMA
    // await approve();
    // stake the KLIMA
    await stake();
  };

  return (
    <Dialog.Root>
      <Dialog.Trigger className={styles.fairLaunchButton}>
        <MdCelebration />
        Participate in Klima Fair Launch
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
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
};