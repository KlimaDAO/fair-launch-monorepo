import { abi as erc20Abi } from "@abi/erc20";
import { abi as klimaFairLaunchAbi } from "@abi/klima-fair-launch";
import { Badge } from "@components/badge";
import { StakeDialog } from "@components/dialogs/stake-dialog";
import { StakeData, StakesTable } from "@components/tables/stakes";
import { Tooltip } from "@components/tooltip";
import gklimaLogo from "@public/tokens/g-klima.svg";
import klimav1Logo from "@public/tokens/klima-v1.svg";
import {
  FAIR_LAUNCH_CONTRACT_ADDRESS,
  KLIMA_V0_TOKEN_ADDRESS,
} from "@utils/constants";
import { calculateUnstakePenalty, calculateUserPoints, totalUserStakes } from "@utils/contract";
import {
  formatLargeNumber,
  formatNumber,
} from "@utils/formatting";
import { fetchUserStakes } from "@utils/queries";
import { config } from "@utils/wagmi.server";
import { readContract } from "@wagmi/core";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { type FC } from "react";
import { formatGwei, formatUnits } from "viem";
import { cookieToInitialState } from "wagmi";
import * as styles from "./styles";
import { LeaderboardsTable } from "@components/tables/leaderboards";
import { calculateLeaderboardPoints } from "@actions/leaderboards-action";

// @todo - move to utils
const calculateTokenPercentage = (tokens: number, totalSupply: number) => {
  if (totalSupply === 0) return 0;
  return (tokens / totalSupply) * 100;
};

const Page: FC = async () => {
  const cookie = (await headers()).get("cookie");
  const initialState = cookieToInitialState(config, cookie);

  const walletAddress =
    initialState?.current &&
    initialState.connections.get(initialState?.current)?.accounts[0];

  const userStakes = await fetchUserStakes(walletAddress ?? null);
  const leaderboardData = await calculateLeaderboardPoints(5);

  const totalSupply = await readContract(config, {
    abi: erc20Abi,
    address: KLIMA_V0_TOKEN_ADDRESS,
    functionName: "totalSupply",
  });

  const previewUserPoints = await readContract(config, {
    abi: klimaFairLaunchAbi,
    address: FAIR_LAUNCH_CONTRACT_ADDRESS,
    functionName: "previewUserPoints",
    args: [walletAddress],
  });

  const tokenPercentage = calculateTokenPercentage(
    totalUserStakes(userStakes.stakes || []),
    Number(formatGwei(totalSupply as bigint))
  );

  // calculate penalties to pass to the stakes table
  const userStakesData = await Promise.all(
    (userStakes.stakes || []).map(async (row) => {
      const points = calculateUserPoints(
        String(row.amount),
        Number(row.multiplier),
        Number(row.startTimestamp)
      );
      const { burnValue, percentage } = await calculateUnstakePenalty(
        row.amount,
        row.startTimestamp
      );
      return {
        ...row,
        id: row.id,
        points,
        burnValue,
        burnPercentage: percentage,
      };
    })
  );

  return (
    <>
      <div className={styles.twoCols}>
        <div className={styles.titleContainer}>
          <h1 className={styles.title}>My Rewards</h1>
          <Tooltip content="Participate early, earn more points.">
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
                {formatNumber(
                  formatUnits(
                    BigInt(totalUserStakes(userStakes.stakes || [])),
                    9
                  )
                )}
              </div>
            </div>
            <div id="onborda-step1" className={styles.secondaryText}>
              <strong>&lt;{tokenPercentage.toFixed(2)}%</strong> of{" "}
              <strong>
                {formatLargeNumber(Number(formatGwei(totalSupply as bigint)))}
              </strong>{" "}
            </div>
          </div>
        </div>
        <div className={styles.divider} />
        <div className={styles.cardInner}>
          <h5 className={styles.cardTitle}>My Points Accumulated</h5>
          <div className={styles.cardContents}>
            <div id="onborda-step2" className={styles.mainText}>
              {formatLargeNumber(
                Number(
                  formatUnits(BigInt((previewUserPoints as bigint) || 0), 9)
                )
              )}
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
            <StakesTable
              data={(userStakesData as StakeData[]) || []}
              totalStaked={totalUserStakes(userStakes.stakes || [])}
            />
          </div>
        </div>
      </div>
      <div className={styles.twoCols}>
        <div className={styles.card}>
          <div className={styles.cardInner}>
            <h5 className={styles.cardTitle}>Leaderboard</h5>
            <div className={styles.cardContents}>
              <LeaderboardsTable data={(leaderboardData as any[]) || []} />
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
