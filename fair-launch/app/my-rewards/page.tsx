import Image from 'next/image';
import type { FC } from "react";
import klimav1Logo from "../../public/tokens/klima-v1.svg";
import gklimaLogo from "../../public/tokens/g-klima.svg";
import { Badge } from "../../components/badge/badge";
import { Footer } from "../../components/footer/footer";
import { Navbar } from "../../components/navbar/navbar";
import { Sidebar } from "../../components/sidebar/sidebar";
import { StakeDialog } from "../../components/dialogs/stake-dialog/stake-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/table/table';
import * as styles from "./page.styles";

const Page: FC = () => {
  return (  
    <div className={styles.container}>
      <Sidebar />
      <div className={styles.main}>
        <Navbar />
        <div className={styles.content}>
          <div className={styles.twoCols}>
            <div className={styles.titleContainer}>
              <h1 className={styles.title}>My Rewards</h1>
              <Badge title="Phase 1" />
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
                  <TableBody>
                    <TableRow>
                      <TableCell>02/01/2025 12:01 am</TableCell>
                      <TableCell>100</TableCell>
                      <TableCell>12,345</TableCell>
                      <TableCell>-75 KLIMA</TableCell>
                      <TableCell>80,000 KLIMAX</TableCell>
                      <TableCell>Unstake</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>02/01/2025 12:01 am</TableCell>
                      <TableCell>100</TableCell>
                      <TableCell>12,345</TableCell>
                      <TableCell>-75 KLIMA</TableCell>
                      <TableCell>80,000 KLIMAX</TableCell>
                      <TableCell>Unstake</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>02/01/2025 12:01 am</TableCell>
                      <TableCell>100</TableCell>
                      <TableCell>12,345</TableCell>
                      <TableCell>-75 KLIMA</TableCell>
                      <TableCell>80,000 KLIMAX</TableCell>
                      <TableCell>Unstake</TableCell>
                    </TableRow>
                  </TableBody>
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