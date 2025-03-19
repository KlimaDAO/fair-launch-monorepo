import { abi as erc20Abi } from "@abi/erc20";
import { abi as klimaFairLaunchAbi } from "@abi/klima-fair-launch";
import { Badge } from "@components/badge";
import { StakeDialog } from "@components/dialogs/stake-dialog/stake-dialog";
import { UnstakeDialog } from "@components/dialogs/unstake-dialog/unstake-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/table";
import { Tooltip } from "@components/tooltip";
import gklimaLogo from "@public/tokens/g-klima.svg";
import klimav1Logo from "@public/tokens/klima-v1.svg";
import { formatNumber, formatTimestamp } from "@utils/formatting";
import { fetchLeaderboard, fetchUserStakes } from "@utils/queries";
import { config } from "@utils/wagmi";
import { readContract, readContracts } from "@wagmi/core";
import clsx from "clsx";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import type { FC } from "react";
import { FAIR_LAUNCH_CONTRACT_ADDRESS, KLIMA_V0_TOKEN_ADDRESS } from "@utils/constants";
import { AbiFunction, formatGwei, formatUnits } from "viem";
import { cookieToInitialState } from "wagmi";
import * as styles from "./styles";

// todo - fix this...
const calculateAllPoints = async () => {
  return await readContracts(config, {
    contracts: [
      {
        abi: klimaFairLaunchAbi as AbiFunction[],
        address: FAIR_LAUNCH_CONTRACT_ADDRESS,
        functionName: "freezeTimestamp",
      },
      {
        abi: klimaFairLaunchAbi as AbiFunction[],
        address: FAIR_LAUNCH_CONTRACT_ADDRESS,
        functionName: "GROWTH_RATE",
      },
      {
        abi: klimaFairLaunchAbi as AbiFunction[],
        address: FAIR_LAUNCH_CONTRACT_ADDRESS,
        functionName: "KLIMA",
      },
      {
        abi: klimaFairLaunchAbi as AbiFunction[],
        address: FAIR_LAUNCH_CONTRACT_ADDRESS,
        functionName: "KLIMAX_SUPPLY",
      },
      {
        abi: klimaFairLaunchAbi as AbiFunction[],
        address: FAIR_LAUNCH_CONTRACT_ADDRESS,
        functionName: "KLIMA_SUPPLY",
      },
      {
        abi: klimaFairLaunchAbi as AbiFunction[],
        address: FAIR_LAUNCH_CONTRACT_ADDRESS,
        functionName: "burnRatio",
      },
      {
        abi: klimaFairLaunchAbi as AbiFunction[],
        address: FAIR_LAUNCH_CONTRACT_ADDRESS,
        functionName: "getTotalPoints",
      },
      {
        abi: klimaFairLaunchAbi as AbiFunction[],
        address: FAIR_LAUNCH_CONTRACT_ADDRESS,
        functionName: "totalBurned",
      },
      {
        abi: klimaFairLaunchAbi as AbiFunction[],
        address: FAIR_LAUNCH_CONTRACT_ADDRESS,
        functionName: "totalOrganicPoints",
      },
      {
        abi: klimaFairLaunchAbi as AbiFunction[],
        address: FAIR_LAUNCH_CONTRACT_ADDRESS,
        functionName: "previewUserPoints",
        args: ["0x5B2D6181d743f314170C4969B8F1c17F6363f200"],
      },
    ],
  });
};

// @todo - move to utils
const calculateTokenPercentage = (tokens: number, totalSupply: number) => {
  if (totalSupply === 0) return 0;
  return (tokens / totalSupply) * 100;
};

// @todo - move to utils
const shortenWalletAddress = (address: string): string => {
  if (address.length <= 10) return address;
  return `${address.slice(0, 5)}...${address.slice(-3)}`;
};

const totalUserStakes = (stakes: { amount: string }[]): number =>
  stakes.reduce((total, stake) => total + parseFloat(stake.amount), 0);

const Page: FC = async () => {
  const cookie = (await headers()).get("cookie");
  const initialState = cookieToInitialState(config, cookie);

  const [, GROWTH_RATE, , , , , , , , previewUserPoints] = await calculateAllPoints();

  const walletAddress =
    initialState?.current &&
    initialState.connections.get(initialState?.current)?.accounts[0];

  const userStakes = walletAddress
    ? await fetchUserStakes(walletAddress)
    : { stakes: [] };
  const leaderboard = (await fetchLeaderboard(5)) || { wallets: [] };

  const totalSupply = await readContract(config, {
    abi: erc20Abi,
    address: KLIMA_V0_TOKEN_ADDRESS,
    functionName: "totalSupply",
  });

  const tokenPercentage = calculateTokenPercentage(
    totalUserStakes(userStakes.stakes || []),
    Number(formatGwei(totalSupply as bigint)) // todo - fetch the total supply from the contract
  );

  const calculateUserPoints = (stakeAmount: number, multiplier: number = 0, stakeTimestamp: number = 3) => {
    const growthRate = Number(GROWTH_RATE.result);
    return stakeAmount * multiplier * Number(stakeTimestamp) * growthRate / 100000;
  }

  const calculatePercentage = (part: number, total: number) => {
    if (total === 0) throw new Error("Total cannot be zero.");
    return (part / total) * 100;
  };

  const getUnstakePenalty = async (stakeAmount: number, stakeTimestamp: number) => {
    const calculateBurn = await readContract(config, {
      abi: klimaFairLaunchAbi,
      address: FAIR_LAUNCH_CONTRACT_ADDRESS,
      functionName: "calculateBurn",
      args: [stakeAmount, stakeTimestamp],
    }) as bigint;

    const burnValue = formatUnits(BigInt(calculateBurn), 9);
    const stakeAmountFormatted = formatUnits(BigInt(stakeAmount), 9);

    return {
      percentage: calculatePercentage(Number(burnValue), Number(stakeAmountFormatted)),
      value: burnValue,
    }
  }

  return (
    <>
      <div className={styles.twoCols}>
        <div className={styles.titleContainer}>
          <h1 className={styles.title}>My Rewards</h1>
          <Tooltip content="Lorem ipsum dolor sit amet consectetur. Nisl rhoncus vitae lectus sit est sed urna varius.">
            <Badge title="Phase 1" />
          </Tooltip>
        </div>
        <StakeDialog />
      </div>
      <div className={styles.card}>
        <div className={styles.cardInner}>
          <h5 className={styles.cardTitle}>My KLIMA(v0) Deposited</h5>
          <div className={styles.cardContents}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.8rem",
              }}
            >
              <Image src={klimav1Logo} alt="Klima V1 Logo" />
              <div className={styles.mainText}>
                {formatNumber(formatUnits(BigInt(totalUserStakes(userStakes.stakes || [])), 9))}
              </div>
            </div>
            <div id="step1" className={styles.secondaryText}>
              <strong>&lt;{tokenPercentage.toFixed(2)}%</strong> of{" "}
              <strong>{formatNumber(formatGwei(totalSupply as bigint))}</strong>{" "}
              MM
            </div>
          </div>
        </div>
        <div className={styles.divider} />
        <div className={styles.cardInner}>
          <h5 className={styles.cardTitle}>My Points Accumulated</h5>
          <div className={styles.cardContents}>
            <div id="step2" className={styles.mainText}>
              {formatNumber(formatUnits(BigInt(previewUserPoints?.result || 0), 9))}
            </div>
            <div className={styles.secondaryText}>
              <strong>&lt;1%</strong> of <strong>12.49</strong> B
            </div>
          </div>
        </div>
      </div>
      <div className={styles.card}>
        <div className={styles.cardInner}>
          <h5 className={styles.cardTitle}>Stake History</h5>
          <div className={styles.cardContents}>
            <Table className={styles.stakingTable}>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>KLIMA(v0) Staked</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Unstake Penalty</TableHead>
                  <TableHead>KLIMAX Allocation</TableHead>
                  <TableHead>&nbsp;</TableHead>
                </TableRow>
              </TableHeader>
              {/* @todo - cleanup all functions inside map */}
              {userStakes.stakes && !!userStakes.stakes.length ? (
                <TableBody>
                  {userStakes.stakes.map(async (stake) => (
                    <TableRow key={stake.id}>
                      <TableCell>
                        {formatTimestamp(parseInt(stake.startTimestamp))}
                      </TableCell>
                      <TableCell>
                        <strong>
                          {formatNumber(formatUnits(BigInt(stake.amount), 9))}
                        </strong>
                      </TableCell>
                      <TableCell>
                        {formatNumber(calculateUserPoints(Number(stake.amount), Number(stake.multiplier), Number(stake.startTimestamp)) / 10 ** 9)}
                      </TableCell>
                      <TableCell>
                        <div>
                          -{await getUnstakePenalty(Number(stake.amount), Number(stake.startTimestamp)).then(({ value }) => value)} KLIMA
                        </div>
                        <div className={styles.penaltyText}>
                          {await getUnstakePenalty(Number(stake.amount), Number(stake.startTimestamp)).then(({ percentage }) => percentage)}%
                        </div>
                      </TableCell>
                      <TableCell>- KLIMAX</TableCell>
                      <TableCell>
                        <UnstakeDialog amount={stake.amount} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              ) : (
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={6}>None yet</TableCell>
                  </TableRow>
                </TableBody>
              )}
            </Table>
          </div>
        </div>
      </div>
      <div className={styles.twoCols}>
        <div className={styles.card}>
          <div className={styles.cardInner}>
            <h5 className={styles.cardTitle}>Leaderboard</h5>
            <div className={styles.cardContents}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Place</TableHead>
                    <TableHead>Wallet</TableHead>
                    <TableHead>KLIMA Staked</TableHead>
                    <TableHead>Points</TableHead>
                  </TableRow>
                </TableHeader>
                {!!leaderboard.wallets.length ? (
                  <TableBody>
                    {leaderboard.wallets.map((wallet, key) => {
                      const isMyWallet =
                        wallet.id.toLowerCase() ===
                        walletAddress?.toLowerCase();
                      return (
                        <TableRow key={wallet.id}>
                          <TableCell>{key + 1}</TableCell>
                          <TableCell>
                            <div
                              className={clsx({
                                [styles.myWalletText]: isMyWallet,
                              })}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.8rem",
                              }}
                            >
                              {shortenWalletAddress(wallet.id)}
                              {isMyWallet && <Badge title="You" />}
                            </div>
                          </TableCell>
                          <TableCell
                            className={clsx({
                              [styles.myWalletText]: isMyWallet,
                            })}
                          >
                            {formatNumber(formatUnits(BigInt(wallet.totalStaked), 9))}
                          </TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                ) : (
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={4}>None yet</TableCell>
                    </TableRow>
                  </TableBody>
                )}
              </Table>
            </div>
            <Link className={styles.leaderboardLink} href="/protocol">
              View full leaderboard
            </Link>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardInner}>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <Image src={gklimaLogo} alt="Klima Logo" />
              <h5 className={styles.cardTitle}>KLIMAX Allocation Value at:</h5>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default Page;
