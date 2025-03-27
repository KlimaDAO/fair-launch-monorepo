import { abi as erc20Abi } from "@abi/erc20";
import { abi as klimaFairLaunchAbi } from "@abi/klima-fair-launch";
import { calculateLeaderboardPoints } from "@actions/leaderboards-action";
import { Badge } from "@components/badge";
import { Card } from "@components/card";
import { StakeDialog } from "@components/dialogs/stake-dialog";
import { Notification } from "@components/notification";
import { KlimaXAllocationTable } from "@components/tables/klimax-allocation";
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
import { readContract, readContracts } from "@wagmi/core";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { MdHelpOutline } from "react-icons/md";
import { AbiFunction, formatGwei, formatUnits, parseUnits } from "viem";
import { cookieToInitialState } from "wagmi";
import * as styles from "./styles";

type SearchParams = Promise<{
  stakeAmount?: string;
  unstakeAmount?: string;
}>;

type PageProps = { searchParams: SearchParams };

const oneWeekInSeconds = 604800;
const twoWeeksInSeconds = 1209600;

const Page = async ({ searchParams }: PageProps) => {
  let phaseLabel = null;
  const cookie = (await headers()).get("cookie");
  const initialState = cookieToInitialState(config, cookie);

  const walletAddress =
    initialState?.current &&
    initialState.connections.get(initialState?.current)?.accounts[0];

  const userStakes = await fetchUserStakes(walletAddress ?? null);
  const leaderboardData = await calculateLeaderboardPoints(5);
  const { stakeAmount, unstakeAmount } = await searchParams;

  const currentTimestamp = Math.floor(Date.now() / 1000);
  const startTimestamp = (await readContract(config, {
    abi: klimaFairLaunchAbi,
    address: FAIR_LAUNCH_CONTRACT_ADDRESS,
    functionName: "startTimestamp",
  })) as bigint;

  if (
    currentTimestamp < Number(startTimestamp) ||
    currentTimestamp - Number(startTimestamp) < oneWeekInSeconds
  ) {
    phaseLabel = "2x Points Boost ACTIVE";
  } else if (currentTimestamp - Number(startTimestamp) < twoWeeksInSeconds) {
    phaseLabel = "1.5x Points Boost ACTIVE";
  }

  const [
    burnRatio,
    totalSupply,
    getTotalPoints,
    growthRate,
    previewUserPoints,
  ] = await readContracts(config, {
    contracts: [
      {
        abi: klimaFairLaunchAbi as AbiFunction[],
        address: FAIR_LAUNCH_CONTRACT_ADDRESS,
        functionName: "burnRatio", // how often does this change?
      },
      {
        abi: erc20Abi as AbiFunction[],
        address: KLIMA_V0_TOKEN_ADDRESS,
        functionName: "totalSupply", // shouldn't change
      },
      {
        abi: klimaFairLaunchAbi as AbiFunction[],
        address: FAIR_LAUNCH_CONTRACT_ADDRESS,
        functionName: "getTotalPoints", // how often does this change?
      },
      {
        abi: klimaFairLaunchAbi as AbiFunction[],
        address: FAIR_LAUNCH_CONTRACT_ADDRESS,
        functionName: "GROWTH_RATE", // shouldnt' change
      },
      {
        abi: klimaFairLaunchAbi as AbiFunction[],
        address: FAIR_LAUNCH_CONTRACT_ADDRESS,
        functionName: "previewUserPoints", // frequently
        args: [walletAddress],
      },
    ],
  });

  // for calculating a users stakes? Can we just grab them from subgraph and the current amount?

  const klimaXSupply = await getKlimaXSupply();

  const userStakesInfoPromise = await readContracts(config, {
    contracts: (userStakes?.stakes || []).map((_, index) => ({
      abi: klimaFairLaunchAbi as AbiFunction[],
      address: FAIR_LAUNCH_CONTRACT_ADDRESS,
      functionName: "userStakes",
      args: [walletAddress, index],
    })),
  }).then((result) =>
    result.map(async (item, index) => {
      let [
        amount,
        stakeStartTime,
        ,
        bonusMultiplier,
        organicPoints,
        burnRatioSnapshot,
        burnAccrued,
      ] = item.result as any;
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const elapsedTime = BigInt(currentTimestamp) - BigInt(stakeStartTime);
      const newPoints =
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
        await calculateUnstakePenalty(amount, stakeStartTime);

      return {
        ...userStakes?.stakes?.[index],
        amount,
        stakeStartTime,
        bonusMultiplier,
        points: newPoints,
        burnRatioSnapshot,
        burnAccrued,
        klimaxAllocation,
        burnValue,
        burnPercentage,
      };
    })
  );

  const allUserStakesInfo = await Promise.all(userStakesInfoPromise);
  const userStakesInfo = allUserStakesInfo
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
      {stakeAmount &&
        <Notification
          title="Stake Successful"
          description={`You have successfully staked ${formatNumber(stakeAmount, 2)} KLIMA. Check back regularly to watch your rewards grow!`}
        />
      }
      {unstakeAmount &&
        <Notification
          title="Unstake Successful"
          description={`You have successfully unstaked ${formatNumber(unstakeAmount, 2)} KLIMA.`}
        />
      }
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
                  Number(formatGwei(totalSupply.result as any))
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
        <h5 className={styles.cardTitle}>Stake History</h5>
        <div className={styles.cardContents}>
          <StakesTable
            data={(userStakesInfo as StakeData[]) || []}
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
