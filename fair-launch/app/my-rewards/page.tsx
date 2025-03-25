import { abi as erc20Abi } from "@abi/erc20";
import { abi as klimaFairLaunchAbi } from "@abi/klima-fair-launch";
import { calculateLeaderboardPoints } from "@actions/leaderboards-action";
import { Badge } from "@components/badge";
import { StakeDialog } from "@components/dialogs/stake-dialog";
import { LeaderboardsTable } from "@components/tables/leaderboards";
import { StakeData, StakesTable } from "@components/tables/stakes";
import { Tooltip } from "@components/tooltip";
import gklimaLogo from "@public/tokens/g-klima.svg";
import klimav1Logo from "@public/tokens/klima-v1.svg";
import {
  FAIR_LAUNCH_CONTRACT_ADDRESS,
  KLIMA_V0_TOKEN_ADDRESS,
} from "@utils/constants";
import {
  calculateTokenPercentage,
  calculateUnstakePenalty,
  getKlimaXSupply,
  totalUserStakes,
} from "@utils/contract";
import { formatLargeNumber, formatNumber } from "@utils/formatting";
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

const Page: FC = async () => {
  const cookie = (await headers()).get("cookie");
  const initialState = cookieToInitialState(config, cookie);

  const walletAddress =
    initialState?.current &&
    initialState.connections.get(initialState?.current)?.accounts[0];

  const userStakes = await fetchUserStakes(walletAddress ?? null);
  const leaderboardData = await calculateLeaderboardPoints(5);

  // group these contract calls into readContracts
  const burnRatio = await readContract(config, {
    abi: klimaFairLaunchAbi,
    address: FAIR_LAUNCH_CONTRACT_ADDRESS,
    functionName: "burnRatio",
  });

  const totalSupply = await readContract(config, {
    abi: erc20Abi,
    address: KLIMA_V0_TOKEN_ADDRESS,
    functionName: "totalSupply",
  });

  const getTotalPoints = await readContract(config, {
    abi: klimaFairLaunchAbi,
    address: FAIR_LAUNCH_CONTRACT_ADDRESS,
    functionName: "getTotalPoints",
  });

  const growthRate = await readContract(config, {
    abi: klimaFairLaunchAbi,
    address: FAIR_LAUNCH_CONTRACT_ADDRESS,
    functionName: "GROWTH_RATE",
  });

  const previewUserPoints = await readContract(config, {
    abi: klimaFairLaunchAbi,
    address: FAIR_LAUNCH_CONTRACT_ADDRESS,
    functionName: "previewUserPoints",
    args: [walletAddress],
  });

  // todo - move this function out...
  const userStakesInfo = await Promise.all(
    (userStakes?.stakes || []).map(async (stake, index) => {
      console.log('stake', stake);
      let userStakesInfo = await readContract(config, {
        abi: klimaFairLaunchAbi,
        address: FAIR_LAUNCH_CONTRACT_ADDRESS,
        functionName: "userStakes",
        args: [walletAddress, index],
      });

      let [amount, stakeStartTime, , bonusMultiplier, organicPoints, burnRatioSnapshot, burnAccrued] = userStakesInfo as [string, string, string, string, string, string, string];
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const elapsedTime = BigInt(currentTimestamp) - BigInt(stakeStartTime);
      const newPoints = (BigInt(amount) * BigInt(bonusMultiplier) * BigInt(elapsedTime) * BigInt(growthRate as bigint)) / BigInt(100000);
      organicPoints = (BigInt(organicPoints) + BigInt(newPoints)).toString();

      const burnRatioDiff = BigInt(burnRatio as bigint) - BigInt(burnRatioSnapshot);
      if (burnRatioDiff > 0) {
        const newBurnAccrual = (BigInt(organicPoints) * burnRatioDiff) / BigInt(100000);
        burnAccrued = (BigInt(burnAccrued) + BigInt(newBurnAccrual)).toString();
      }

      const klimaXSupply = await getKlimaXSupply();
      const klimaxAllocation = (BigInt(newPoints) * BigInt(klimaXSupply as bigint)) / BigInt(getTotalPoints as bigint);
      // let totalPoints = Number(organicPoints) + Number(burnAccrued);

      return {
        id: stake.id,
        amount: stake.amount,
        startTimestamp: stake.startTimestamp,
        stakeCreationHash: stake.stakeCreationHash,
        multiplier: stake.multiplier,
        points: newPoints,
        klimaxAllocation,
      };
    }));

  const tokenPercentage = calculateTokenPercentage(
    Number(formatUnits(BigInt(totalUserStakes(userStakes.stakes || [])), 9)),
    Number(formatGwei(totalSupply as bigint))
  );

  const totalPointsPercentage = calculateTokenPercentage(
    Number(formatUnits(BigInt((previewUserPoints as bigint) || 0), 9)),
    Number(formatGwei(getTotalPoints as bigint))
  );

  // calculate penalties to pass to the stakes table
  const userStakesData = await Promise.all(
    (userStakesInfo || []).sort((a, b) => Number(b.startTimestamp) - Number(a.startTimestamp)).map(async (row) => {
      const { burnValue, percentage } = await calculateUnstakePenalty(
        row.amount,
        row.startTimestamp
      );
      return {
        ...row,
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
          <div id="step1" className={styles.cardContents}>
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
                  ),
                  2
                )}
              </div>
            </div>
            <div className={styles.secondaryText}>
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
            <div id="step2" className={styles.mainText}>
              {formatLargeNumber(
                Number(
                  formatUnits(BigInt((previewUserPoints as bigint) || 0), 9)
                )
              )}
            </div>
            <div className={styles.secondaryText}>
              <strong>&lt;{totalPointsPercentage.toFixed(2)}%</strong> of{" "}
              <strong>
                {formatLargeNumber(
                  Number(
                    formatUnits(BigInt((getTotalPoints as bigint) || 0), 9)
                  )
                )}
              </strong>
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
            <LeaderboardsTable data={(leaderboardData as any[]) || []} />
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
