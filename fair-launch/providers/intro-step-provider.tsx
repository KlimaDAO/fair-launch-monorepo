import type { FC, ReactNode } from "react";
import { CustomIntroCard } from '../components/intro-card';
import { NextStepProvider, NextStep } from 'nextstepjs';

interface Props {
  children: ReactNode;
};

export const IntroStepProvider: FC<Props> = (props) => {
  return (
    <NextStep
      displayArrow={true}
      steps={[
        {
          tour: "walkthrough",
          steps: [
            {
              icon: "",
              title: "",
              content: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', color: '#fff', fontFamily: 'var(--font-inter)' }}>
                  <div style={{ fontSize: '12px', fontWeight: '400' }}>
                    Here’s where you can view your total KLIMA deposited. Depositing KLIMA is what we call “Staking.”
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '400' }}>
                    Staking is the only way to acquire KLIMAX, which we’ll explain in a moment.
                  </div>
                </div>
              ),
              selector: "#step1",
              showControls: true,
              side: "bottom-right",
              showSkip: false,
              viewportID: "ss-viewport"
            },
            {
              icon: "",
              title: "",
              content: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', color: '#fff', fontFamily: 'var(--font-inter)' }}>
                  <div style={{ fontSize: '12px', fontWeight: '400' }}>
                    Here’s where you can view your total points accumulated. The longer you leave your KLIMA staked, the more points you’ll receive.             </div>
                  <div style={{ fontSize: '12px', fontWeight: '400' }}>
                    At the end of our Fair Launch period, you’ll receive a share of our new token, KLIMAX, based on how many points you’ve earned.            </div>
                </div>
              ),
              selector: "#step2",
              side: "bottom-right",
              showControls: true,
              showSkip: true,
            },
          ]
        }
      ]}
      shadowOpacity="0"
      cardComponent={CustomIntroCard}
      cardTransition={{ duration: 0.25, ease: 'easeInOut' }}>
      {props.children}
    </NextStep>
  );
}