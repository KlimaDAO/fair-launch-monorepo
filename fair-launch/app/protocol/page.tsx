import { abi as klimaFairLaunchAbi } from "@abi/klima-fair-launch";
import { calculateLeaderboardPoints } from "@actions/leaderboards-action";
import { LeaderboardsTable } from "@components/tables/leaderboards";
import klimav1Logo from "@public/tokens/klima-v1.svg";
import {
  FAIR_LAUNCH_CONTRACT_ADDRESS,
  KLIMA_V0_TOKEN_ADDRESS,
} from "@utils/constants";
import { calculateTokenPercentage } from "@utils/contract";
import { formatLargeNumber, formatNumber } from "@utils/formatting";
import { config } from "@utils/wagmi.server";
import { readContract } from "@wagmi/core";
import clsx from "clsx";
import Image from "next/image";
import { type FC } from "react";
import { css } from "styled-system/css";
import { erc20Abi, formatGwei, formatUnits } from "viem";
import * as styles from "./styles";
import { Card } from "@components/card";

const Page: FC = async () => {
  const klimaPrice = await fetch(
    "https://base.klimadao.finance/api/prices?symbols=KLIMA"
  );
  const { data } = await klimaPrice.json();
  const price = data?.KLIMA?.[0]?.quote?.USD?.price;
  const leaderboardData = await calculateLeaderboardPoints(100);

  const totalBurned = (await readContract(config, {
    abi: klimaFairLaunchAbi,
    address: FAIR_LAUNCH_CONTRACT_ADDRESS,
    functionName: "totalBurned",
  })) as bigint;

  const totalStaked = (await readContract(config, {
    abi: klimaFairLaunchAbi,
    address: FAIR_LAUNCH_CONTRACT_ADDRESS,
    functionName: "totalStaked",
  })) as bigint;

  const totalSupply = await readContract(config, {
    abi: erc20Abi,
    address: KLIMA_V0_TOKEN_ADDRESS,
    functionName: "totalSupply",
  });

  const tokenPercentage = calculateTokenPercentage(
    Number(formatUnits(totalStaked, 9)),
    Number(formatUnits(totalSupply, 9))
  );

  return (
    <>
      <div className={styles.twoCols}>
        <div className={styles.titleContainer}>
          <h1 className={styles.title}>Protocol</h1>
        </div>
      </div>
      <div className={styles.card}>
        <div className={styles.cardInner}>
          <h5 className={styles.cardTitle}>Total KLIMA(v0) Deposited</h5>
          <div className={styles.cardContents}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Image src={klimav1Logo} alt="Klima V1 Logo" />
              <div className={styles.mainText}>
                {formatNumber(formatUnits(totalStaked, 9), 2)}
              </div>
            </div>
            <div className={styles.secondaryText}>
              <strong>{tokenPercentage.toFixed(2)}%</strong> of{" "}
              <strong>
                {formatLargeNumber(Number(formatUnits(totalSupply, 9)))}
              </strong>{" "}
            </div>
          </div>
        </div>
        <div className={styles.divider} />
        <div className={styles.cardInner}>
          <h5 className={styles.cardTitle}>$TVL</h5>
          <div className={styles.cardContents}>
            <div className={styles.mainText}>
              ${formatNumber(price * Number(formatUnits(totalStaked, 9)), 2)}
            </div>
          </div>
        </div>
        <div className={styles.divider} />
        <div className={styles.cardInner}>
          <h5 className={styles.cardTitle}>KLIMA(v1) Burned</h5>
          <div className={styles.cardContents}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
              <Image src={klimav1Logo} alt="Klima V1 Logo" />
              <div className={styles.mainText}>
                {formatNumber(formatUnits(totalBurned, 9), 2)}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Card>
        <LeaderboardsTable showPagination data={(leaderboardData as any[]) || []} />
      </Card>
    </>
  );
};

export default Page;
