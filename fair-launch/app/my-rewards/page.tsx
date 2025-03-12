import Image from 'next/image';
import type { FC } from "react";
import gklimaLogo from "@public/tokens/g-klima.svg";
import klimav1Logo from "@public/tokens/klima-v1.svg";
import { Badge } from "@components/badge/badge";
import { Footer } from "@components/footer/footer";
import { Navbar } from "@components/navbar/navbar";
import { config } from '@utils/wagmi';
import { Sidebar } from "@components/sidebar/sidebar";
import { headers } from 'next/headers'
import { Tooltip } from '@components/tooltip/tooltip';
import { StakeDialog } from "@components/dialogs/stake-dialog/stake-dialog";
import { UnstakeDialog } from '@components/dialogs/unstake-dialog/unstake-dialog';
import { cookieToInitialState } from 'wagmi'
import { fetchUserStakes, fetchLeaderboard } from '@utils/queries';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/table/table';
import * as styles from "./page.styles";

// @todo - move to utils
const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp * 1000); // Convert to milliseconds
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };
  return date.toLocaleString('en', options).replace(',', '');
}

// @todo - move to utils
const shortenWalletAddress = (address: string): string => {
  if (address.length <= 10) return address;
  return `${address.slice(0, 5)}...${address.slice(-3)}`;
}

// @todo - move to utils
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

const totalUserStakes = (stakes: { amount: string }[]): number =>
  stakes.reduce((total, stake) => total + parseFloat(stake.amount), 0);

const Page: FC = async () => {
  const cookie = (await headers()).get('cookie');
  const initialState = cookieToInitialState(config, cookie);
  const walletAddress = initialState?.current && initialState.connections.get(initialState?.current)?.accounts[0];
  const userStakes = walletAddress ? await fetchUserStakes(walletAddress) : { stakes: [] };
  const leaderboard = await fetchLeaderboard() || { wallets: [] };

  return (
    <div className={styles.container}>
      <Sidebar />
      <div className={styles.main}>
        <Navbar />
        <div className={styles.content}>
          <div className={styles.twoCols}>
            <div className={styles.titleContainer}>
              <h1 className={styles.title}>My Rewards</h1>
              <Tooltip content="Lorem ipsum dolor sit amet consectetur. Nisl rhoncus vitae lectus sit est sed urna varius.">
                <Badge title="Phase 1" />
              </Tooltip>
            </div>
            <StakeDialog />
          </div>
          <div className={styles.card}>
            <div className={styles.cardInner}>
              <h5 style={{ fontSize: '16px', fontWeight: '400', color: 'void.80' }}>My KLIMA(v0) Deposited</h5>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '20px', fontWeight: '700' }} id='step1'>
                  <Image src={klimav1Logo} alt="Klima V1 Logo" />
                  {totalUserStakes(userStakes.stakes || [])}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '400', color: '#64748B' }} id='step2'><strong>&lt;1%</strong> of <strong>21.34</strong> MM</div>
              </div>
            </div>
            <div className={styles.divider} />
            <div className={styles.cardInner}>
              <h5 style={{ fontSize: '16px', fontWeight: '400', color: 'void.80' }}>My Points Accumulated</h5>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '20px', fontWeight: '700' }} id='step3'>0</div>
                <div style={{ fontSize: '14px', fontWeight: '400', color: '#64748B' }}><strong>&lt;1%</strong> of <strong>12.49</strong> B</div>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardInner}>
              <h5 style={{ fontSize: '16px', fontWeight: '400', color: 'void.80' }}>Stake History</h5>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>KLIMA(v0) Staked</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Unstake Penalty</TableHead>
                      <TableHead>KLIMAX Allocation</TableHead>
                      <TableHead>&nbsp;</TableHead>
                    </TableRow>
                  </TableHeader>
                  {userStakes.stakes && !!userStakes.stakes.length ? (
                    <TableBody>
                      {userStakes.stakes.map((stake) => (
                        <TableRow key={stake.id}>
                          <TableCell>
                            {formatTimestamp(parseInt(stake.startTimestamp))}
                          </TableCell>
                          <TableCell>
                            <strong>{formatCurrency(parseFloat(stake.amount))}</strong>
                          </TableCell>
                          <TableCell>12,345</TableCell>
                          <TableCell>-75 KLIMA</TableCell>
                          <TableCell>80,000 KLIMAX</TableCell>
                          <TableCell>
                            <UnstakeDialog />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  ) : (
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={6}>None yet</TableCell>
                      </TableRow>
                    </TableBody>
                  )}
                </Table>
              </div>
            </div>
          </div>

          <div className={styles.twoCols}>
            <div className={styles.card}>
              <div className={styles.cardInner}>
                <h5 style={{ fontSize: '16px', fontWeight: '400', color: 'void.80' }}>Leaderboard</h5>
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
                            <TableCell>
                              {shortenWalletAddress(wallet.id)}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(parseFloat(wallet.totalStaked))}
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
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardInner}>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                  <Image src={gklimaLogo} alt="Klima Logo" />
                  <h5 style={{ fontSize: '16px', fontWeight: '400', color: 'void.80' }}>
                    KLIMAX Allocation Value at:
                  </h5>
                </div>
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