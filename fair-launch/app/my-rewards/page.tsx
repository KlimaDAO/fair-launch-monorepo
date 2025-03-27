import { abi as erc20Abi } from "@abi/erc20";
import { abi as klimaFairLaunchAbi } from "@abi/klima-fair-launch";
import { calculateLeaderboardPoints } from "@actions/leaderboards-action";
import { Badge } from "@components/badge";
import { StakeDialog } from "@components/dialogs/stake-dialog";
import { StakeData, StakesTable } from "@components/tables/stakes";
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
import { Notification } from "@components/notification";
import { formatGwei, formatUnits } from "viem";
import { cookieToInitialState } from "wagmi";
import * as styles from "./styles";
import { KlimaXAllocationTable } from "@components/tables/klimax-allocation";
import { Card } from "@components/card";
import { LeaderboardsTable } from "@components/tables/leaderboards";

type SearchParams = Promise<{
  stakeAmount?: string,
  unstakeAmount?: string
}>;

const oneWeekInSeconds = 604800;
const twoWeeksInSeconds = 1209600;

const Page = async (props: { searchParams: SearchParams }) => {
  let phaseLabel = null;
  const cookie = (await headers()).get("cookie");
  const initialState = cookieToInitialState(config, cookie);

  const walletAddress =
    initialState?.current &&
    initialState.connections.get(initialState?.current)?.accounts[0];

  const userStakes = await fetchUserStakes(walletAddress ?? null);
  const leaderboardData = await calculateLeaderboardPoints(5);
  const { stakeAmount, unstakeAmount } = await props.searchParams;

  const currentTimestamp = Math.floor(Date.now() / 1000);
  const startTimestamp = await readContract(config, {
    abi: klimaFairLaunchAbi,
    address: FAIR_LAUNCH_CONTRACT_ADDRESS,
    functionName: "startTimestamp",
  }) as bigint;

  if (currentTimestamp < Number(startTimestamp) || (currentTimestamp - Number(startTimestamp)) < oneWeekInSeconds) {
    phaseLabel = '2x Points Boost ACTIVE';
  } else if ((currentTimestamp - Number(startTimestamp)) < twoWeeksInSeconds) {
    phaseLabel = '1.5x Points Boost ACTIVE';
  }

  // group these contract calls into readContracts
  const burnRatio = await readContract(config, {
    abi: klimaFairLaunchAbi,
    address: FAIR_LAUNCH_CONTRACT_ADDRESS,
    functionName: "burnRatio",
  }) as bigint;

  const totalSupply = await readContract(config, {
    abi: erc20Abi,
    address: KLIMA_V0_TOKEN_ADDRESS,
    functionName: "totalSupply",
  }) as bigint;

  const getTotalPoints = await readContract(config, {
    abi: klimaFairLaunchAbi,
    address: FAIR_LAUNCH_CONTRACT_ADDRESS,
    functionName: "getTotalPoints",
  }) as bigint;

  const growthRate = await readContract(config, {
    abi: klimaFairLaunchAbi,
    address: FAIR_LAUNCH_CONTRACT_ADDRESS,
    functionName: "GROWTH_RATE",
  }) as bigint;

  const previewUserPoints = await readContract(config, {
    abi: klimaFairLaunchAbi,
    address: FAIR_LAUNCH_CONTRACT_ADDRESS,
    functionName: "previewUserPoints",
    args: [walletAddress],
  }) as bigint;

  // todo - move this function out...
  const userStakesPromise = await Promise.all(
    (userStakes?.stakes || []).map(async (stake, index) => {
      const userStakesInfo = await readContract(config, {
        abi: klimaFairLaunchAbi,
        address: FAIR_LAUNCH_CONTRACT_ADDRESS,
        functionName: "userStakes",
        args: [walletAddress, index],
      }) as bigint[];

      let [amount, stakeStartTime, , bonusMultiplier, organicPoints, burnRatioSnapshot, burnAccrued] = userStakesInfo;
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const elapsedTime = BigInt(currentTimestamp) - BigInt(stakeStartTime);
      const newPoints = (BigInt(amount) * BigInt(bonusMultiplier) * BigInt(elapsedTime) * BigInt(growthRate as bigint)) / BigInt(100000);
      organicPoints = (BigInt(organicPoints) + BigInt(newPoints));

      const burnRatioDiff = BigInt(burnRatio) - BigInt(burnRatioSnapshot);
      if (burnRatioDiff > 0) {
        const newBurnAccrual = (BigInt(organicPoints) * burnRatioDiff) / BigInt(100000);
        burnAccrued = (BigInt(burnAccrued) + BigInt(newBurnAccrual));
      }
      const supply = formatUnits(BigInt(await getKlimaXSupply()), 9);
      const klimaxAllocation = BigInt(newPoints) * BigInt(supply) / BigInt(getTotalPoints);

      return {
        id: stake.id,
        amount: BigInt(amount),
        startTimestamp: stake.startTimestamp,
        stakeCreationHash: stake.stakeCreationHash,
        multiplier: stake.multiplier,
        points: newPoints,
        klimaxAllocation: klimaxAllocation,
      };
    }));

  const userStakesInfo = userStakesPromise
    .filter((item) => item.amount !== BigInt(0));

  const tokenPercentage = calculateTokenPercentage(
    Number(formatUnits(BigInt(totalUserStakes(userStakesInfo || [])), 9)),
    Number(formatUnits(totalSupply, 9))
  );

  const totalPointsPercentage = calculateTokenPercentage(
    Number(formatUnits(previewUserPoints, 9)),
    Number(formatUnits(getTotalPoints, 9))
  );

  // calculate penalties to pass to the stakes table
  const userStakesData = await Promise.all(
    (userStakesInfo || [])
      .sort((a, b) => Number(b.startTimestamp) - Number(a.startTimestamp))
      .map(async (values) => {
        const { burnValue, percentage: burnPercentage } = await calculateUnstakePenalty(
          values.amount,
          values.startTimestamp
        );
        return { ...values, burnValue, burnPercentage };
      })
  );

  return (
    <>
      {stakeAmount && (
        <Notification
          title="Stake Successful"
          description={`You have successfully staked ${stakeAmount} KLIMA. Check back regularly to watch your rewards grow!`}
        />
      )}
      {unstakeAmount && (
        <Notification
          title="Unstake Successful"
          description={`You have successfully unstaked ${unstakeAmount} KLIMA.`}
        />
      )}
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
                  formatUnits(
                    BigInt(totalUserStakes(userStakesInfo || [])),
                    9
                  ),
                  2
                )}
              </div>
            </div>
            <div className={styles.secondaryText}>
              <strong>&lt;{tokenPercentage.toFixed(2)}%</strong> of{" "}
              <strong >
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
      <Card>
        <h5 className={styles.cardTitle}>Stake History</h5>
        <div className={styles.cardContents}>
          <StakesTable
            data={(userStakesData as StakeData[]) || []}
            totalStaked={Number(totalUserStakes(userStakesInfo || []))}
          />
        </div>
      </Card>
      <div className={styles.twoCols}>
        <Card>
          <LeaderboardsTable data={(leaderboardData as any[]) || []} />
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
              gap: "1rem",
            }}
          >
            <Image src={gklimaLogo} alt="Klima Logo" />
            <h5 className={styles.cardTitle}>KlimaX Allocation Value at:</h5>
          </div>
          <div className={styles.cardContents}>
            <KlimaXAllocationTable data={[]} />
          </div>
        </Card>
      </div>
    </>
  );
};
export default Page;
