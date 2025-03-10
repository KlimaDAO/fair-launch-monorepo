import Image from 'next/image';
import type { FC } from "react";
import klimav1Logo from "../../public/tokens/klima-v1.svg";
import gklimaLogo from "../../public/tokens/g-klima.svg";
import { Badge } from "../../components/badge/badge";
import { Footer } from "../../components/footer/footer";
import { Navbar } from "../../components/navbar/navbar";
import { config } from '../../utils/wagmi';
import { Sidebar } from "../../components/sidebar/sidebar";
import { request } from 'graphql-request';
import { headers } from 'next/headers'
import { Tooltip } from '../../components/tooltip/tooltip';
import { StakeDialog } from "../../components/dialogs/stake-dialog/stake-dialog";
import { cookieToInitialState } from 'wagmi'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/table/table';
import * as styles from "./page.styles";

const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/28985/fair-launch-sepolia/version/latest';

export const fetchUserStakes = async (address: string): Promise<UserStakes> => {
  return await request(
    SUBGRAPH_URL,
    `query ($address: String!) {
      stakes(first: 100, where: { wallet: $address }) {
        id
        amount
        startTimestamp
        stakeCreationHash
        multiplier
      }
    }`,
    { address: address.toLowerCase() }
  );
};

interface Stake {
  id: string;
  amount: string;
  multiplier: string;
  startTimestamp: string;
  stakeCreationHash: string;
}

interface UserStakes {
  stakes?: Stake[];
}

const Page: FC = async () => {
  const cookie = (await headers()).get('cookie');
  const initialState = cookieToInitialState(config, cookie);
  const walletAddress = initialState?.current && initialState.connections.get(initialState?.current)?.accounts[0];
  const userStakes = walletAddress ? await fetchUserStakes(walletAddress) : { stakes: [] };

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
              <h5 style={{ fontSize: '16px', fontWeight: '400', color: '#64748B' }}>My KLIMA(v1) Deposited</h5>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '20px', fontWeight: '700' }} id='step1'>
                  <Image src={klimav1Logo} alt="Klima V1 Logo" />
                  0.00
                </div>
                <div style={{ fontSize: '14px', fontWeight: '400', color: '#64748B' }} id='step2'><strong>&lt;1%</strong> of <strong>21.34</strong> MM</div>
              </div>
            </div>
            <div className={styles.divider} />
            <div className={styles.cardInner}>
              <h5 style={{ fontSize: '16px', fontWeight: '400', color: '#64748B' }}>My Points Accumulated</h5>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '20px', fontWeight: '700' }} id='step3'>0</div>
                <div style={{ fontSize: '14px', fontWeight: '400', color: '#64748B' }}><strong>&lt;1%</strong> of <strong>12.49</strong> B</div>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardInner}>
              <h5 style={{ fontSize: '16px', fontWeight: '400', color: '#64748B' }}>Stake History</h5>
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
                  {userStakes.stakes && userStakes.stakes.length > 0 ? (
                    <TableBody>
                      {userStakes.stakes.map((stake: Stake) => (
                        <TableRow key={stake.id}>
                          <TableCell>{stake.startTimestamp}</TableCell>
                          <TableCell>{stake.amount}</TableCell>
                          <TableCell>12,345</TableCell>
                          <TableCell>-75 KLIMA</TableCell>
                          <TableCell>80,000 KLIMAX</TableCell>
                          <TableCell>Unstake</TableCell>
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
                <h5 style={{ fontSize: '16px', fontWeight: '400', color: '#64748B' }}>Leaderboard</h5>
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
                    <TableBody>
                      <TableRow>
                        <TableCell>1</TableCell>
                        <TableCell>0x1234567890</TableCell>
                        <TableCell>100.26</TableCell>
                        <TableCell>100.26</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>2</TableCell>
                        <TableCell>0x1234567890</TableCell>
                        <TableCell>100.26</TableCell>
                        <TableCell>100.26</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
            <div className={styles.card}>
              <div className={styles.cardInner}>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                  <Image src={gklimaLogo} alt="Klima Logo" />
                  <h5 style={{ fontSize: '16px', fontWeight: '400', color: '#64748B' }}>
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