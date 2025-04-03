import { abi as klimaFairLaunchAbi } from "@abi/klima-fair-launch";
import { Card } from "@components/card";
import { LeaderboardsTable } from "@components/tables/leaderboards";
import klimav1Logo from "@public/tokens/klima-v1.svg";
import { calculateTokenPercentage } from "@utils/contract";
import { formatLargeNumber, formatNumber } from "@utils/formatting";
import { config as wagmiConfig } from "@utils/wagmi.server";
import { getConfig } from "@utils/constants";
import { readContract } from "@wagmi/core";
import Image from "next/image";
import { getTotalSupply } from "@actions/total-supply-action";
import { type FC } from "react";
import { formatUnits } from "viem";
import * as styles from "./styles";

const Page: FC = async () => {
  const config = getConfig();
  const klimaPrice = await fetch(
    "https://base.klimadao.finance/api/prices?symbols=KLIMA"
  );
  const { data } = await klimaPrice.json();
  const price = data?.KLIMA?.[0]?.quote?.USD?.price;

  const totalSupply = await getTotalSupply();
  const totalBurned = (await readContract(wagmiConfig, {
    abi: klimaFairLaunchAbi,
    address: config.fairLaunchContractAddress,
    functionName: "totalBurned",
  })) as bigint;

  const totalStaked = (await readContract(wagmiConfig, {
    abi: klimaFairLaunchAbi,
    address: config.fairLaunchContractAddress,
    functionName: "totalStaked",
  })) as bigint;

  const tokenPercentage = calculateTokenPercentage(
    Number(formatUnits(totalStaked, 9)),
    Number(formatUnits(totalSupply!, 9))
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
          <h5 className={styles.cardTitle}>Total KLIMA Deposited</h5>
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
                {formatLargeNumber(Number(formatUnits(totalSupply!, 9)))}
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
          <h5 className={styles.cardTitle}>KLIMA Burned</h5>
          <div className={styles.cardContents}>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}
            >
              <Image src={klimav1Logo} alt="Klima V1 Logo" />
              <div className={styles.mainText}>
                {formatNumber(formatUnits(totalBurned, 9), 2)}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Card>
        <LeaderboardsTable showPagination />
      </Card>
    </>
  );
};

export default Page;
