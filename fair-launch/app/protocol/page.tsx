import Image from 'next/image';
import type { FC } from "react";
import { Footer } from "../../components/footer/footer";
import { Navbar } from "../../components/navbar/navbar";
import { Sidebar } from "../../components/sidebar/sidebar";
import klimav1Logo from "../../public/tokens/klima-v1.svg";
import { Dropdown } from '../../components/dropdown/dropdown';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/table/table';
import * as styles from "./page.styles";

const dropdownItems = [
  { value: '1', label: 'Points - high to low' },
  { value: '2', label: 'Points - low to high' }
];

const Page: FC = () => {
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
              <h5 style={{ fontSize: '16px', fontWeight: '400', color: '#64748B' }}>My KLIMA(v0) Deposited</h5>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '20px', fontWeight: '700' }} id='step1'>
                  <Image src={klimav1Logo} alt="Klima V1 Logo" />
                  21,340,466
                </div>
                <div style={{ fontSize: '14px', fontWeight: '400', color: '#64748B' }} id='step2'><strong>50%</strong> of <strong>42</strong> MM</div>
              </div>
            </div>
            <div className={styles.divider} />
            <div className={styles.cardInner}>
              <h5 style={{ fontSize: '16px', fontWeight: '400', color: '#64748B' }}>$TVL</h5>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '20px', fontWeight: '700' }} id='step3'>$14,000,000</div>
              </div>
            </div>
            <div className={styles.divider} />
            <div className={styles.cardInner}>
              <h5 style={{ fontSize: '16px', fontWeight: '400', color: '#64748B' }}>KLIMA(v1) Burned</h5>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '20px', fontWeight: '700' }} id='step1'>
                  <Image src={klimav1Logo} alt="Klima V1 Logo" />
                  40,000,000
                </div>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardInner}>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <h5 style={{ fontSize: '16px', fontWeight: '400', color: '#64748B' }}>Leaderboard</h5>
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
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}

export default Page;