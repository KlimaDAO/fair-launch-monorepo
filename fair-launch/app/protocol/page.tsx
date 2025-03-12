import Image from 'next/image';
import type { FC } from "react";
import klimav1Logo from "@public/tokens/klima-v1.svg";
import { Footer } from "@components/footer/footer";
import { Navbar } from "@components/navbar/navbar";
import { Sidebar } from "@components/sidebar/sidebar";
import { Dropdown } from '@components/dropdown/dropdown';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/table/table';
import * as styles from "./page.styles";
import { fetchLeaderboard } from '@utils/queries';
import { readContract } from '@wagmi/core'
import { config } from '@utils/wagmi';
import { abi as klimaFairLaunchAbi } from '../../abi/klima-fair-launch';
import { formatUnits } from 'viem';

const contractAddress = '0x5D7c2a994Ca46c2c12a605699E65dcbafDeae80c';


const dropdownItems = [
  { value: '1', label: 'Points - high to low' },
  { value: '2', label: 'Points - low to high' }
];


const Page: FC = async () => {
  const leaderboard = await fetchLeaderboard() || { wallets: [] };
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '20px', fontWeight: '700' }} id='step1'>
                  <Image src={klimav1Logo} alt="Klima V1 Logo" />
                  {BigInt(totalStaked)}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '400', color: '#64748B' }} id='step2'><strong>50%</strong> of <strong>42</strong> MM</div>
              </div>
            </div>
            <div className={styles.divider} />
            <div className={styles.cardInner}>
              <h5 className={styles.cardTitle}>$TVL</h5>
              <div className={styles.cardContents}>
                <div style={{ fontSize: '20px', fontWeight: '700' }} id='step3'>$14,000,000</div>
              </div>
            </div>
            <div className={styles.divider} />
            <div className={styles.cardInner}>
              <h5 className={styles.cardTitle}>KLIMA(v1) Burned</h5>
              <div className={styles.cardContents}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '20px', fontWeight: '700' }} id='step1'>
                  <Image src={klimav1Logo} alt="Klima V1 Logo" />
                  40,000,000
                </div>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardInner}>
              <div className={styles.cardTitle}>Leaderboard</div>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Place</TableHead>
                      <TableHead>Wallet</TableHead>
                      <TableHead>KLIMA Staked</TableHead>
                      <TableHead>Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  {leaderboard?.wallets && !!leaderboard.wallets.length ? (
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
                  )}
                </Table>
              </div>
            </div>
          </div>


          {/* <div className={styles.card}>
            <div className={styles.cardInner}>
              <div className={styles.cardContents}>
                <h5 className={styles.cardTitle}>Leaderboard</h5>
                <Dropdown
                  selected={dropdownItems[0]}
                  items={[
                    { value: '1', label: 'Points - high to low' },
                    { value: '2', label: 'Points - low to high' }
                  ]} />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Place</TableHead>
                    <TableHead>Wallet</TableHead>
                    <TableHead>KLIMA(v0) Staked</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>&nbsp;</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>1</TableCell>
                    <TableCell>0x1234567890</TableCell>
                    <TableCell>100.26</TableCell>
                    <TableCell>100.26</TableCell>
                    <TableCell>&nbsp;</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>2</TableCell>
                    <TableCell>0x1234567890</TableCell>
                    <TableCell>100.26</TableCell>
                    <TableCell>100.26</TableCell>
                    <TableCell>&nbsp;</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div> */}
        </div>
        <Footer />
      </div>
    </div>
  );
}

export default Page;