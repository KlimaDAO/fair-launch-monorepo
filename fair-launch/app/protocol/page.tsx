'use client';

import Image from 'next/image';
import klimav1Logo from "@public/tokens/klima-v1.svg";
import { Footer } from "@components/footer/footer";
import { config } from '@utils/wagmi';
import { Navbar } from "@components/navbar/navbar";
import { Sidebar } from "@components/sidebar/sidebar";
import { Dropdown } from '@components/dropdown/dropdown';
import { readContract } from '@wagmi/core'
import { fetchLeaderboard } from '@utils/queries';
import { type FC, useState } from "react";
import { abi as klimaFairLaunchAbi } from '@abi/klima-fair-launch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/table/table';
import * as styles from "./page.styles";

// @todo - move to utils
const contractAddress = '0x5D7c2a994Ca46c2c12a605699E65dcbafDeae80c';

const dropdownItems = [
  { value: '1', label: 'Points - high to low' },
  { value: '2', label: 'Points - low to high' }
];

const Page: FC = async () => {

  // const [selectedDropdown, setSelectedDropdown] = useState(
  //   dropdownItems[0]
  // );

  // console.log('selectedDropdown', selectedDropdown);

  // replace this call with react-query? 
  // const leaderboard = await fetchLeaderboard() || { wallets: [] };
  const totalStaked = await readContract(config, {
    abi: klimaFairLaunchAbi,
    address: contractAddress,
    functionName: 'totalStaked',
  }) as bigint;

  return (
    <div className={styles.container}>
      <Sidebar />
      <div className={styles.main}>
        <Navbar />
        <div className={styles.content}>
          <div className={styles.twoCols}>
            <div className={styles.titleContainer}>
              <h1 className={styles.title}>Protocol</h1>
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardInner}>
              <h5 className={styles.cardTitle}>My KLIMA(v0) Deposited</h5>
              <div className={styles.cardContents}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Image src={klimav1Logo} alt="Klima V1 Logo" />
                  <div className={styles.mainText}>
                    {BigInt(totalStaked)}
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
                <div className={styles.mainText}>$14,000,000</div>
              </div>
            </div>
            <div className={styles.divider} />
            <div className={styles.cardInner}>
              <h5 className={styles.cardTitle}>KLIMA(v1) Burned</h5>
              <div className={styles.cardContents}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Image src={klimav1Logo} alt="Klima V1 Logo" />
                  <div className={styles.mainText}>40,000,000</div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardInner}>
              <div className={styles.cardContents}>
                <div className={styles.cardTitle}>
                  Leaderboard
                </div>
                <Dropdown
                  // onValueChange={(item) => console.log('item', item)}
                  selected={dropdownItems[0]}
                  items={[
                    { value: '1', label: 'Points - high to low' },
                    { value: '2', label: 'Points - low to high' }
                  ]} />
              </div>
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
                  {/* {leaderboard?.wallets && !!leaderboard.wallets.length ? (
                    <TableBody>
                      {leaderboard.wallets.map((wallet) => (
                        <TableRow key={wallet.id}>
                          <TableCell>1</TableCell>
                          <TableCell>{wallet.id}</TableCell>
                          <TableCell>{wallet.totalStaked}</TableCell>
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
                  )} */}
                </Table>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}

export default Page;