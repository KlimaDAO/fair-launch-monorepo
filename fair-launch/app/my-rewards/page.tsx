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
import { AbiFunction, formatGwei } from "viem";
import { cookieToInitialState } from "wagmi";
import * as styles from "./styles";

const klimaV0TokenAddress = "0x3E63e9c64942399e987A04f0663A5c1Cba9c148A";
const fairLaunchAddress = "0x5D7c2a994Ca46c2c12a605699E65dcbafDeae80c";

// todo - fix this...
const calculatePoints = async (Si = 50, t = 30, Ri = 0) => {
  const allContracts = await readContracts(config, {
    contracts: [
      {
        abi: klimaFairLaunchAbi as AbiFunction[],
        address: fairLaunchAddress,
        functionName: "freezeTimestamp",
      },
      {
        abi: klimaFairLaunchAbi as AbiFunction[],
        address: fairLaunchAddress,
        functionName: "GROWTH_RATE",
      },
      {
        abi: klimaFairLaunchAbi as AbiFunction[],
        address: fairLaunchAddress,
        functionName: "KLIMA",
      },
      {
        abi: klimaFairLaunchAbi as AbiFunction[],
        address: fairLaunchAddress,
        functionName: "KLIMAX_SUPPLY",
      },
      {
        abi: klimaFairLaunchAbi as AbiFunction[],
        address: fairLaunchAddress,
        functionName: "KLIMA_SUPPLY",
      },
      {
        abi: klimaFairLaunchAbi as AbiFunction[],
        address: fairLaunchAddress,
        functionName: "burnRatio",
      },
      {
        abi: klimaFairLaunchAbi as AbiFunction[],
        address: fairLaunchAddress,
        functionName: "getTotalPoints",
      },
      {
        abi: klimaFairLaunchAbi as AbiFunction[],
        address: fairLaunchAddress,
        functionName: "totalBurned",
      },
      {
        abi: klimaFairLaunchAbi as AbiFunction[],
        address: fairLaunchAddress,
        functionName: "totalOrganicPoints",
      },
      {
        abi: klimaFairLaunchAbi as AbiFunction[],
        address: fairLaunchAddress,
        functionName: "previewUserPoints",
        args: ["0xA1506e051861dd5A6128e6D55B4c3f465dc21d5f"],
      },
    ],
  });

  console.log("allContracts", allContracts);

  const originalStakedAmount = 1000;
  const daysStaked = 1;
  const multiplier = 200; // fetch the multiplier
  const growthConstant = 274; // fetch the growth constant
  const growthDenominator = 100000;
  const expectedPoints =
    (originalStakedAmount * multiplier * daysStaked * growthConstant) /
    growthDenominator;
  // Calculate final points using the formula
  console.log("calc", expectedPoints);
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

  const walletAddress =
    initialState?.current &&
    initialState.connections.get(initialState?.current)?.accounts[0];

  const userStakes = walletAddress
    ? await fetchUserStakes(walletAddress)
    : { stakes: [] };
  const leaderboard = (await fetchLeaderboard(5)) || { wallets: [] };

  const totalSupply = await readContract(config, {
    abi: erc20Abi,
    address: klimaV0TokenAddress,
    functionName: "totalSupply",
  });

  const tokenPercentage = calculateTokenPercentage(
    totalUserStakes(userStakes.stakes || []),
    Number(formatGwei(totalSupply as bigint)) // todo - fetch the total supply from the contract
  );

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
                {formatNumber(totalUserStakes(userStakes.stakes || []))}
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
              0
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
            <Table>
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
              {userStakes.stakes && !!userStakes.stakes.length ? (
                <TableBody>
                  {userStakes.stakes.map((stake) => (
                    <TableRow key={stake.id}>
                      <TableCell>
                        {formatTimestamp(parseInt(stake.startTimestamp))}
                      </TableCell>
                      <TableCell>
                        <strong>
                          {formatNumber(parseFloat(stake.amount))}
                        </strong>
                      </TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>- KLIMA</TableCell>
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
                            {formatNumber(parseFloat(wallet.totalStaked))}
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
