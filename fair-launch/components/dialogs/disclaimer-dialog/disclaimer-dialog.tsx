'use client';

import type { FC } from "react";
import { Dialog } from "radix-ui";
import { MdCelebration } from "react-icons/md";
import * as styles from './disclaimer-dialog.styles';

type FocusOutsideEvent = CustomEvent<{ originalEvent: FocusEvent }>;
type PointerDownOutsideEvent = CustomEvent<{ originalEvent: PointerEvent }>;

export const DisclaimerDialog: FC = () => (
  <Dialog.Root>
    <Dialog.Trigger className={styles.fairLaunchButton}>
      <MdCelebration />
      Risk Disclaimer
    </Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className={styles.overlay} />
      <Dialog.Content
        className={styles.content}
        onInteractOutside={(e: PointerDownOutsideEvent | FocusOutsideEvent) => {
          e.preventDefault();
          e.stopPropagation();
        }}>
        <Dialog.Title className={styles.title}>
          Risk Disclaimer
        </Dialog.Title>
        <Dialog.Description className={styles.description}>
          <p>Purchasing cryptocurrencies, including the $KLIMA token, involves a high degree of risk and should be considered extremely speculative. Here are some  important points to consider:</p>
          <p>Loss of Investment: The value of $KLIMA and other cryptocurrencies can  rapidly increase or decrease at any time. As a result, you could  experience significant and rapid losses, including the loss of all money invested.</p>
          <p>Lack of Liquidity: There may be no active market for $KLIMA, which may result in losses if you need to sell your tokens quickly.</p>
          <p>Regulatory Actions and Changes: The regulatory environment for cryptocurrencies is evolving and changes in regulation could adversely affect your  investment.</p>
          <p>Operational Risks: The KlimaDAO platform relies on various technologies related to  the Polygon network and other digital assets. These technologies are  subject to change, and such changes could adversely affect your  investment.</p>
          <p>No Guarantee: There is no guarantee that the KlimaDAO platform or the  $KLIMA token will achieve its objectives or that any value will be  retained in the Protocol.</p>
          <p>This summary risk warning does not disclose all the risks associated with  investing in $KLIMA. You should conduct your own due diligence and  consult with a financial advisor before making any investment decisions.</p>
        </Dialog.Description>
        <div className={styles.actions}>
          <button className={styles.proceedButton}>
            Acknowledge and Accept
          </button>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
);