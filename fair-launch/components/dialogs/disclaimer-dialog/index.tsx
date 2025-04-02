"use client";

import { Dialog } from "radix-ui";
import { type FC, useEffect, useState } from "react";
import { MdInfo } from "react-icons/md";
import * as styles from "./styles";

type InteractOutsideEvent =
  | CustomEvent<{ originalEvent: FocusEvent }>
  | CustomEvent<{ originalEvent: PointerEvent }>;

export const isNil = (value: string | null | undefined): boolean =>
  value === null || value === undefined;

export const DisclaimerDialog: FC = () => {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (isNil(window?.localStorage?.getItem("disclaimer_accepted"))) {
      setShowModal(true);
    }
  }, []);

  const setDisclaimer = () => {
    window.localStorage.setItem("disclaimer_accepted", "");
    setShowModal(false);
  };

  if (!showModal) {
    return null;
  }

  return (
    <Dialog.Root open={showModal}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content
          className={styles.content}
          onInteractOutside={(e: InteractOutsideEvent) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div className={styles.icon}>
            <MdInfo />
          </div>
          <Dialog.Title className={styles.title}>Risk Disclaimer</Dialog.Title>
          <div className={styles.description}>
            <div>
              Purchasing cryptocurrencies, including the $KLIMA token, involves
              a high degree of risk and should be considered extremely
              speculative. Here are some important points to consider:
            </div>
            <div>
              Loss of Investment: The value of $KLIMA and other cryptocurrencies
              can rapidly increase or decrease at any time. As a result, you
              could experience significant and rapid losses, including the loss
              of all money invested.
            </div>
            <div>
              Lack of Liquidity: There may be no active market for $KLIMA, which
              may result in losses if you need to sell your tokens quickly.
            </div>
            <div>
              Regulatory Actions and Changes: The regulatory environment for
              cryptocurrencies is evolving and changes in regulation could
              adversely affect your investment.
            </div>
            <div>
              Operational Risks: The KlimaDAO platform relies on various
              technologies related to the Base network and other digital assets.
              These technologies are subject to change, and such changes could
              adversely affect your investment.
            </div>
            <div>
              No Guarantee: There is no guarantee that the Klima Protocol or the
              $KLIMA token will achieve its objectives or that any value will be
              retained in the Protocol.
            </div>
            <div>
              This summary risk warning does not disclose all the risks
              associated with investing in $KLIMA. You should conduct your own
              due diligence and consult with a financial advisor before making
              any investment decisions.
            </div>
            <div>
              This message does not constitute financial advice, an offer, or a
              solicitation to buy or sell any investment product.
            </div>
          </div>
          <div className={styles.actions}>
            <button onClick={setDisclaimer} className={styles.button}>
              Acknowledge and Accept
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
