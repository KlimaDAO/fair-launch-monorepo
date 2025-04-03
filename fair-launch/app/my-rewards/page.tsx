import { abi as klimaFairLaunchAbi } from "@abi/klima-fair-launch";
import { getContractConstants } from "@actions/contract-reads-action";
import { Card } from "@components/card";
import { StakeDialog } from "@components/dialogs/stake-dialog";
import { UnstakeDialog } from "@components/dialogs/unstake-dialog";
import { Notification } from "@components/notification";
import { PhaseBadge } from "@components/phase-badge";
import { KlimaXAllocationTable } from "@components/tables/klimax-allocation";
import { LeaderboardsTable } from "@components/tables/leaderboards";
import { StakesTable } from "@components/tables/stakes";
import { Tooltip } from "@components/tooltip";
import gklimaLogo from "@public/tokens/g-klima.svg";
import klimav1Logo from "@public/tokens/klima-v1.svg";
import {
  calculateTokenPercentage,
  calculateUnstakePenalty,
  getKlimaXSupply,
  totalUserStakes,
} from "@utils/contract";
import {
  formatLargeNumber,
  formatNumber,
  truncateAddress,
} from "@utils/formatting";
import { config as wagmiConfig } from "@utils/wagmi.server";
import { readContracts } from "@wagmi/core";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { MdHelpOutline } from "react-icons/md";
import { AbiFunction, formatUnits, parseUnits } from "viem";
import { getConfig } from "@utils/constants";
import { getTotalSupply } from "@actions/total-supply-action";
import { cookieToInitialState } from "wagmi";
import * as styles from "./styles";

type StakeResult = [bigint, bigint, bigint, bigint, bigint, bigint, bigint];


const Page = async () => {
  const config = getConfig();
  const headersList = await headers();
  const cookie = headersList.get("cookie");
  const initialState = cookieToInitialState(wagmiConfig, cookie);

  const walletAddress =
    initialState?.current &&
    initialState.connections.get(initialState?.current)?.accounts[0];

  const totalSupply = await getTotalSupply();
  const contractConstants = await getContractConstants(walletAddress as string);
  if (!Array.isArray(contractConstants)) {
    throw new Error("Failed to fetch contract constants");
  }

  const [
    prestakingWindow,
    startTimestamp,
    burnRatio,
    getTotalPoints,
    growthRate,
    previewUserPoints,
    userStakeCount,
    burnDistributionPrecision,
    pointsScaleDenominator,
  ] = contractConstants;

  const klimaXSupply = await getKlimaXSupply();
  const stakes = new Array(Number(userStakeCount.result)).fill("");
  // todo - move this to an action or util?
  const userStakes = await readContracts(wagmiConfig, {
    contracts: stakes.map((_, index) => ({
      abi: klimaFairLaunchAbi as AbiFunction[],
      address: config.fairLaunchContractAddress,
      functionName: "userStakes",
      args: [walletAddress, index],
    })),
  }).then((stakes) =>
    stakes.map(async ({ result }) => {
      let [
        amount,
        stakeStartTime,
        ,
        bonusMultiplier,
        organicPoints,
        burnRatioSnapshot,
        burnAccrued,
      ] = result as StakeResult;

      // skip if stake amount is zero
      if (amount === BigInt(0)) {
        return null;
      }

      const timestamp = Math.floor(Date.now() / 1000);
      const elapsedTime = Number(timestamp) - Number(stakeStartTime);
      const timeElapsedDays = elapsedTime / 86400;

      const totalKlimaXSupply = formatUnits(BigInt(klimaXSupply), 9);
      const growthFactor = Math.exp(
        Number(growthRate.result) * timeElapsedDays - 1e18
      );
      const basePoints =
        (BigInt(amount) * parseUnits(bonusMultiplier.toString(), 18)) /
        (BigInt(100) * pointsScaleDenominator.result!);
      const newPoints = BigInt(basePoints) * BigInt(growthFactor);
      let updatedPoints = newPoints + BigInt(organicPoints);

      const burnRatioDiff =
        BigInt(burnRatio.result!) - BigInt(burnRatioSnapshot);
      if (burnRatioDiff > 0) {
        const newBurnAccrual =
          (BigInt(organicPoints) * burnRatioDiff) /
          burnDistributionPrecision.result!;
        burnAccrued = BigInt(burnAccrued) + BigInt(newBurnAccrual);
      }
      updatedPoints = updatedPoints + burnAccrued;

      const klimaxAllocation =
        (BigInt(updatedPoints) * BigInt(totalKlimaXSupply)) /
        BigInt(getTotalPoints.result!);

      const { burnValue, percentage: burnPercentage } =
        await calculateUnstakePenalty(amount, String(stakeStartTime));

      return {
        amount,
        stakeStartTime,
        bonusMultiplier,
        points: updatedPoints,
        burnRatioSnapshot,
        burnAccrued,
        klimaxAllocation,
        burnValue,
        burnPercentage,
      };
    })
  );

  const allUserStakes = (await Promise.all(userStakes))
    .filter((stake) => stake !== null)
    .sort((a, b) => Number(b.stakeStartTime) - Number(a.stakeStartTime));

  const tokenPercentage = calculateTokenPercentage(
    Number(formatUnits(BigInt(totalUserStakes(allUserStakes)), 9)),
    Number(formatUnits(totalSupply!, 9))
  );

  const totalPointsPercentage = calculateTokenPercentage(
    Number(formatUnits(previewUserPoints.result!, 18)),
    Number(formatUnits(getTotalPoints.result!, 18))
  );

  const totalStaked = Number(totalUserStakes(allUserStakes));

  return (
    <>
      <Notification />
      <div className={styles.twoCols}>
        <div className={styles.titleContainer}>
          <h1 className={styles.title}>My Rewards</h1>
          <PhaseBadge
            prestakingWindow={Number(prestakingWindow.result)}
            startTimestamp={Number(startTimestamp.result)}
          />
        </div>
        <StakeDialog />
        {walletAddress && (
          <div className={styles.walletAddress}>
            Your Wallet Address:
            <span>{truncateAddress(walletAddress as string)}</span>
          </div>
        )}
      </div>
      <div className={styles.card}>
        <div className={styles.cardInner}>
          <h5 className={styles.cardTitle}>My KLIMA Deposited</h5>
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
                  formatUnits(BigInt(totalUserStakes(allUserStakes || [])), 9),
                  4
                )}
              </div>
            </div>
            <div className={styles.secondaryText}>
              <strong>&lt;{tokenPercentage.toFixed(2)}%</strong> of{" "}
              <strong>
                {formatLargeNumber(
                  Number(formatUnits(totalSupply!, 9))
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
                Number(formatUnits(BigInt(previewUserPoints.result || 0), 18))
              )}
            </div>
            <div className={styles.secondaryText}>
              <strong>&lt;{totalPointsPercentage.toFixed(2)}%</strong> of{" "}
              <strong>
                {formatLargeNumber(
                  Number(formatUnits(BigInt(getTotalPoints.result || 0), 18))
                )}
              </strong>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <div className={styles.stakeHistoryContainer}>
          <h5 className={styles.cardTitle} id="step3">
            Stake History
          </h5>
          <div>
            {allUserStakes.length > 0 && (
              <UnstakeDialog
                stakes={allUserStakes}
                startTimestamp={String(allUserStakes[0].stakeStartTime)}
                totalStaked={Number(totalUserStakes(allUserStakes || []))}
              />
            )}
            <Tooltip content="When you unstake KLIMA, your tokens are always unstaked from the most recent stake first.">
              <MdHelpOutline className={styles.klimaXHelp} />
            </Tooltip>
          </div>
        </div>
        <div className={styles.cardContents}>
          <StakesTable data={allUserStakes || []} totalStaked={totalStaked} />
        </div>
      </Card>

      <div className={styles.twoCols}>
        <Card>
          <LeaderboardsTable pageSize={5} />
          <div className={styles.leaderboardFooter}>
            <div>Updated every 15 minutes</div>
            <Link className={styles.leaderboardLink} href="/protocol">
              View full leaderboard
            </Link>
          </div>
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
                My KlimaX Allocation Value At:
              </div>
            </div>
            <Tooltip content="If more users stake and earn points, your individual share of the KlimaX allocation may decrease. The projections below are based on your current share percentage.">
              <MdHelpOutline className={styles.klimaXHelp} />
            </Tooltip>
          </div>
          <div className={styles.cardContents}>
            <KlimaXAllocationTable
              userPoints={BigInt(previewUserPoints.result!)}
              totalPoints={BigInt(getTotalPoints.result!)}
            />
          </div>
        </Card>
      </div>
    </>
  );
};

export default Page;
