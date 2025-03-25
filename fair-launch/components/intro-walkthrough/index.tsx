'use client';

import type { FC } from 'react';
import { driver } from 'driver.js';
import { TourDialog } from '@components/dialogs/tour-dialog';

export const IntroWalkthrough: FC = () => {
  const handleWalkthrough = () => {
    const driverObj = driver({
      showProgress: true,
      overlayOpacity: 0,
      allowClose: false,
      steps: [
        {
          element: '#step1',
          popover: {
            side: "bottom",
            align: "end",
            showButtons: ['next'],
            progressText: `Step 2/6`,
            nextBtnText: 'Next',
            description: `
              <div style="display:flex;flex-direction:column;gap:10px;color:#fff;font-family:var(--font-inter);">
                <div style="font-size:12px;font-weight:400;">
                  Here’s where you can view your total KLIMA deposited. Depositing KLIMA is what we call "Staking."
                </div>
                <div style="font-size:12px;font-weight:400;">
                  Staking is the only way to acquire KlimaX, which we’ll explain in a moment.
                </div>
              </div>
            `
          },
        },
        {
          element: '#step2',
          popover: {
            side: "bottom",
            align: "end",
            showButtons: ['previous', 'next'],
            progressText: `Step 3/6`,
            nextBtnText: 'Next',
            prevBtnText: 'Back',
            description: `
                <div style="display:flex;flex-direction:column;gap:10px;color:#fff;font-family:var(--font-inter);">
                  <div style="font-size:12px;font-weight:400;">
                    Here’s where you can view your total points accumulated. The longer you leave your KLIMA(v0) staked, the more points you’ll receive. 
                  </div>
                  <div style="font-size:12px;font-weight:400;">
                    At the end of our Fair Launch period, you’ll receive a share of our new token, KlimaX, based on how many points you’ve earned. You’ll also receive an allocation of our improved flagship token, KLIMA(v1).
                  </div>
                </div>
              `
          },
        },
        {
          element: '#step3',
          popover: {
            side: "bottom",
            align: "center",
            showButtons: ['previous', 'next'],
            progressText: `Step 4/6`,
            nextBtnText: 'Next',
            prevBtnText: 'Back',
            description: `
              <div style="display:flex;flex-direction:column;gap:10px;color:#fff;font-family:var(--font-inter);">
                <div style="font-size:12px;font-weight:400;">
                  This table shows you each time you’ve staked, and what rewards you’ve earned from that stake.
                </div>
              </div>
              `
          },
        },
        {
          element: '#step4',
          popover: {
            side: "bottom",
            align: "center",
            showButtons: ['previous', 'next'],
            progressText: `Step 5/6`,
            nextBtnText: 'Next',
            prevBtnText: 'Back',
            description: `
                <div style="display:flex;flex-direction:column;gap:10px;color:#fff;font-family:var(--font-inter);">
                  <div style="font-size:12px;font-weight:400;">
                    This table also shows you our estimate of how much KlimaX you’ll receive at the end of our Fair Launch.
                  </div>
                  <div style="font-size:12px;font-weight:400;">
                    The KlimaX you hold can vote to influence KLIMA's carbon purchasing decisions. Votes are real-time market data that allow the protocol to price carbon credits.
                  </div>
                </div>
              `
          },
        },
        {
          element: '#step5',
          popover: {
            side: "right",
            align: "center",
            showButtons: ['previous', 'next'],
            progressText: `Step 6/6`,
            nextBtnText: 'Finish',
            prevBtnText: 'Back',
            description: `
                <div style="display:flex;flex-direction:column;gap:10px;color:#fff;font-family:var(--font-inter);">
                  <div style="font-size:12px;font-weight:400;">
                    You can view leaderboards, DAO metrics, and other information on the Protocol Dashboard.
                  </div>
                  <div style="font-size:12px;font-weight:400;">
                    Remember: the earlier you stake, and the longer you leave your KLIMA staked, the higher your rewards.
                  </div>
                  <div style="font-size:12px;font-weight:400;">
                    You can learn more about Klima 2.0 by <a href="https://klima.network/whitepaper" target="_blank" rel="noopener noreferrer">downloading our whitepaper</a>.
                  </div>
                </div>
              `
          },
        },
      ]
    });
    driverObj.drive();
  }

  return (
    <TourDialog
      onClose={() => {
        handleWalkthrough();
      }}
    />
  );
};
