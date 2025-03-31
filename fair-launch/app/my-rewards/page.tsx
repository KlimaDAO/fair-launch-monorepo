'use server';

import { abi as klimaFairLaunchAbi } from "@abi/klima-fair-launch";
import { getContractConstants } from "@actions/contract-reads-action";
import { calculateLeaderboardPoints } from "@actions/leaderboards-action";
import { Badge } from "@components/badge";
import { Card } from "@components/card";
import { StakeDialog } from "@components/dialogs/stake-dialog";
import { UnstakeDialog } from "@components/dialogs/unstake-dialog";
import { Notification } from "@components/notification";
import { KlimaXAllocationTable } from "@components/tables/klimax-allocation";
// import { LeaderboardsTable } from "@components/tables/leaderboards";
import { StakeData, StakesTable } from "@components/tables/stakes";
import { Tooltip } from "@components/tooltip";
import gklimaLogo from "@public/tokens/g-klima.svg";
import klimav1Logo from "@public/tokens/klima-v1.svg";
import { FAIR_LAUNCH_CONTRACT_ADDRESS } from "@utils/constants";
import {
  calculateTokenPercentage,
  calculateUnstakePenalty,
  getKlimaXSupply,
  totalUserStakes,
} from "@utils/contract";
import { formatLargeNumber, formatNumber } from "@utils/formatting";
import { fetchUserStakes } from "@utils/queries";
import { config } from "@utils/wagmi.server";
import { readContract, readContracts } from "@wagmi/core";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { MdHelpOutline } from "react-icons/md";
import { AbiFunction, formatUnits } from "viem";
import { cookieToInitialState } from "wagmi";
import * as styles from "./styles";
import { LeaderboardsTable } from "@components/tables/leaderboards";
import { Suspense } from "react";

const oneWeekInSeconds = 604800;
const twoWeeksInSeconds = 1209600;

type StakeResult = [bigint, bigint, bigint, bigint, bigint, bigint, bigint];

const Page = async () => {
  let phaseLabel = null;

  const headersList = await headers();
  const cookie = headersList.get("cookie");
  const initialState = cookieToInitialState(config, cookie);

  const walletAddress =
    initialState?.current &&
    initialState.connections.get(initialState?.current)?.accounts[0];

  const currentTimestamp = Math.floor(Date.now() / 1000);
  const { stakes, error } = await fetchUserStakes(walletAddress ?? null);
  // const leaderboardData = await calculateLeaderboardPoints(5);

  // move this and cache...
  const startTimestamp = (await readContract(config, {
    abi: klimaFairLaunchAbi,
    address: FAIR_LAUNCH_CONTRACT_ADDRESS,
    functionName: "startTimestamp",
  })) as bigint;

  // move this...
  if (
    currentTimestamp < Number(startTimestamp) ||
    currentTimestamp - Number(startTimestamp) < oneWeekInSeconds
  ) {
    phaseLabel = "2x Points Boost ACTIVE";
  } else if (currentTimestamp - Number(startTimestamp) < twoWeeksInSeconds) {
    phaseLabel = "1.5x Points Boost ACTIVE";
  }

  const contractConstants = await getContractConstants(walletAddress as any);
  if (!contractConstants || !Array.isArray(contractConstants)) {
    throw new Error("Failed to fetch contract constants");
  }

  const [
    burnRatio,
    totalSupply,
    getTotalPoints,
    growthRate,
    previewUserPoints,
  ] = contractConstants;

  // get the time elapsed in days
  // const _timestamp = Math.floor(Date.now() / 1000);
  // const elapsedTime = Number(currentTimestamp) - Number(stakeStartTime);
  // let timeElapsedDays = elapsedTime / 86400;

  // Calculate e^(growthRate * timeElapsedDays) - 1
  // const growthFactor = Math.exp(274 * timeElapsedDays) - 1e18;

  // for calculating a users stakes? Can we just grab them from subgraph and the current amount?

  const klimaXSupply = await getKlimaXSupply();

  const userStakesInfoPromise = await readContracts(config, {
    contracts: (stakes || []).map((_, index) => ({
      abi: klimaFairLaunchAbi as AbiFunction[],
      address: FAIR_LAUNCH_CONTRACT_ADDRESS,
      functionName: "userStakes",
      args: [walletAddress, index],
    })),
  }).then((result) =>
    result.map(async ({ result }, index) => {
      let [
        amount,
        stakeStartTime,
        ,
        bonusMultiplier,
        organicPoints,
        burnRatioSnapshot,
        burnAccrued,
      ] = result as StakeResult;

      // Skip if stake amount is zero
      // if (amount === 0) return null;

      const currentTimestamp = Math.floor(Date.now() / 1000);
      const elapsedTime = BigInt(currentTimestamp) - BigInt(stakeStartTime);

      // Determine the cutoff time for point accrual
      // uint256 cutoffTime = block.timestamp;
      // if (block.timestamp > freezeTimestamp) {
      //     cutoffTime = freezeTimestamp;
      // }

      // Only accrue points up to the cutoff time (always capped at freezeTimestamp)
      //  uint256 timeElapsed = 0;
      //  if (cutoffTime > currentStake.lastUpdateTime) {
      //      timeElapsed = cutoffTime - currentStake.lastUpdateTime;
      //  }

      // if (timeElapsed > 0) {

      let newPoints =
        (BigInt(amount) *
          BigInt(bonusMultiplier) *
          BigInt(elapsedTime) *
          BigInt(growthRate.result as any)) /
        BigInt(100000);

      const burnRatioDiff =
        BigInt(burnRatio.result as any) - BigInt(burnRatioSnapshot);

      if (burnRatioDiff > 0) {
        const newBurnAccrual =
          (BigInt(organicPoints) * burnRatioDiff) / BigInt(100000);
        burnAccrued = BigInt(burnAccrued) + BigInt(newBurnAccrual);
      }

      const supply = formatUnits(BigInt(klimaXSupply), 9);
      const klimaxAllocation =
        (BigInt(newPoints) * BigInt(supply)) /
        BigInt(getTotalPoints.result as any);

      const { burnValue, percentage: burnPercentage } =
        await calculateUnstakePenalty(amount, String(stakeStartTime));

      // handle formatting here
      return {
        ...stakes?.[index],
        amount,
        stakeStartTime,
        bonusMultiplier,
        points: newPoints + burnAccrued,
        burnRatioSnapshot,
        burnAccrued,
        klimaxAllocation,
        burnValue,
        burnPercentage,
      };
    })
  );

  // const allUserStakesInfo = await Promise.all(userStakesInfoPromise);
  const userStakesInfo = (await Promise.all(userStakesInfoPromise))
    .filter((item) => item.amount !== BigInt(0))
    .sort((a, b) => Number(b.startTimestamp) - Number(a.startTimestamp));

  const tokenPercentage = calculateTokenPercentage(
    Number(formatUnits(BigInt(totalUserStakes(userStakesInfo)), 9)),
    Number(formatUnits(totalSupply.result as any, 9))
  );

  const totalPointsPercentage = calculateTokenPercentage(
    Number(formatUnits(previewUserPoints.result as any, 9)),
    Number(formatUnits(getTotalPoints.result as any, 9))
  );

  return (
    <>
      <Notification />
      <div className={styles.twoCols}>
        <div className={styles.titleContainer}>
          <h1 className={styles.title}>My Rewards</h1>
          {phaseLabel && <Badge title={phaseLabel} />}
        </div>
        <StakeDialog />
      </div>
      <div className={styles.card}>
        <div className={styles.cardInner}>
          <h5 className={styles.cardTitle}>My KLIMA(v0) Deposited</h5>
          <div className={styles.cardContents}>
            <div
              id="step1"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.8rem",
              }}
            >
              <Image src={klimav1Logo} alt="Klima V1 Logo" />
              <div className={styles.mainText}>
                {formatNumber(
                  formatUnits(BigInt(totalUserStakes(userStakesInfo || [])), 9),
                  2
                )}
              </div>
            </div>
            <div className={styles.secondaryText}>
              <strong>&lt;{tokenPercentage.toFixed(2)}%</strong> of{" "}
              <strong>
                {formatLargeNumber(
                  Number(formatUnits(totalSupply.result as any, 9))
                )}
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
                  formatUnits(BigInt((previewUserPoints.result as any) || 0), 9)
                )
              )}
            </div>
            <div className={styles.secondaryText}>
              <strong>&lt;{totalPointsPercentage.toFixed(2)}%</strong> of{" "}
              <strong>
                {formatLargeNumber(
                  Number(
                    formatUnits(BigInt((getTotalPoints.result as any) || 0), 9)
                  )
                )}
              </strong>
            </div>
          </div>
        </div>
      </div>
      <Card>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            marginBottom: "1rem",
          }}
        >
          <h5 className={styles.cardTitle}>Stake History</h5>
          {userStakesInfo.length > 0 && (
            <UnstakeDialog
              startTimestamp={String(userStakesInfo[0].startTimestamp)}
              totalStaked={Number(totalUserStakes(userStakesInfo || []))}
            />
          )}
        </div>
        <div className={styles.cardContents}>
          {error ? (
            <p style={{ color: "red" }}>{error}</p>
          ) : (
            <StakesTable
              data={(userStakesInfo as StakeData[]) || []}
              totalStaked={Number(totalUserStakes(userStakesInfo || []))}
            />
          )}
        </div>
      </Card>
      <div className={styles.twoCols}>
        <Card>
          {/* <LeaderboardsTable data={(leaderboardData as any[]) || []} /> */}
          <Suspense fallback={<div>Loading...</div>}>
            <LeaderboardsTable maxItems={5} />
          </Suspense>
          <Link className={styles.leaderboardLink} href="/protocol">
            View full leaderboard
          </Link>
        </Card>
        <Card>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
            }}
          >
            <div className={styles.klimaXTitle}>
              <Image src={gklimaLogo} alt="Klima Logo" />
              <div className={styles.cardTitle}>
                KlimaX Allocation Value at:
              </div>
            </div>
            <Tooltip content="As the value of KLIMA increases, so does your projected allocation. However, as the number of stakes increases, your overall share of KLIMA will naturally decrease.">
              <MdHelpOutline className={styles.klimaXHelp} />
            </Tooltip>
          </div>
          <div className={styles.cardContents}>
            <KlimaXAllocationTable userShare={totalPointsPercentage} />
          </div>
        </Card>
      </div>
    </>
  );
};

export default Page;
