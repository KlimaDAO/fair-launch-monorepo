'use client';

import type { FC } from 'react';
import { CardComponentProps } from 'nextstepjs';
import * as styles from './intro-card.styles';

export const CustomIntroCard: FC<CardComponentProps> = (props) => {
  const { step, currentStep, prevStep, totalSteps, nextStep } = props;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className={styles.card}>
      <div>{step.title}</div>
      <div>{step.content}</div>
      {step.showControls && (
        <div className={styles.buttons}>
          {currentStep > 0 && (
            <button className={styles.backButton} onClick={prevStep}>
              Back
            </button>
          )}
          <button className={styles.nextButton} onClick={nextStep}>
            {isLastStep ? 'Finish' : 'Next'}
          </button>
        </div>
      )}
      <div className={styles.steps}>Step {currentStep + 1}/{totalSteps}</div>
    </div >
  );
};