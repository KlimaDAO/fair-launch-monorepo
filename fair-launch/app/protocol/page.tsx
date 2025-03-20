import Image from "next/image";
import klimav1Logo from "@public/tokens/klima-v1.svg";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/table";
import { config } from "@utils/wagmi.server";
import { type FC } from "react";
import { Dropdown } from "@components/dropdown";
import { formatUnits } from "viem";
import { readContract } from "@wagmi/core";
import { formatNumber } from "@utils/formatting";
import { fetchLeaderboard } from "@utils/queries";
import { abi as klimaFairLaunchAbi } from "@abi/klima-fair-launch";
import { FAIR_LAUNCH_CONTRACT_ADDRESS } from "@utils/constants";
import * as styles from "./styles";

const dropdownItems = [
  { value: "1", label: "Points - high to low" },
  { value: "2", label: "Points - low to high" },
];

const Page: FC = async () => {
  const klimaPrice = await fetch('https://base.klimadao.finance/api/prices?symbols=KLIMA');
  const { data } = await klimaPrice.json();
  const price = data?.KLIMA?.[0]?.quote?.USD?.price;

  const totalBurned = await readContract(config, {
    abi: klimaFairLaunchAbi,
    address: FAIR_LAUNCH_CONTRACT_ADDRESS,
    functionName: "totalBurned",
  }) as bigint;

  // replace this call with react-query?
  const leaderboard = (await fetchLeaderboard()) || { wallets: [] };
  const totalStaked = (await readContract(config, {
    abi: klimaFairLaunchAbi,
    address: FAIR_LAUNCH_CONTRACT_ADDRESS,
    functionName: "totalStaked",
  })) as bigint;

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
                {formatNumber(formatUnits(totalStaked, 9))}
              </div>
            </div>
            <div className={styles.secondaryText}>
              <strong>50%</strong> of <strong>42</strong> MM
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
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Image src={klimav1Logo} alt="Klima V1 Logo" />
              <div className={styles.mainText}>
                {formatNumber(formatUnits(totalBurned, 9))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardInner}>
          <div className={styles.cardContents}>
            <div className={styles.cardTitle}>Leaderboard</div>
            <Dropdown
              selected={dropdownItems[0]}
              items={[
                { value: "1", label: "Points - high to low" },
                { value: "2", label: "Points - low to high" },
              ]}
            />
          </div>
          <div className={styles.cardContents}>
            <Table className={styles.leaderboardTable}>
              <TableHeader>
                <TableRow>
                  <TableHead>Place</TableHead>
                  <TableHead>Wallet</TableHead>
                  <TableHead>KLIMA(v0) Staked</TableHead>
                  <TableHead>Points</TableHead>
                </TableRow>
              </TableHeader>
              {!!leaderboard?.wallets?.length ? (
                <TableBody>
                  {leaderboard.wallets.map((wallet, index) => (
                    <TableRow key={wallet.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{wallet.id}</TableCell>
                      <TableCell>
                        {formatNumber(formatUnits(BigInt(wallet.totalStaked), 9))}
                      </TableCell>
                      <TableCell>-</TableCell>
                    </TableRow>
                  ))}
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
          <div>Showing 1 to 2 of 2 results</div>
        </div>
      </div>
    </>
  );
};

export default Page;
