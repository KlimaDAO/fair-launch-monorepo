"use client";

import { useRouter } from "next/navigation";
import { ConnectButton as RainbowConnectButton } from "@rainbow-me/rainbowkit";
import * as styles from "./styles";

export const ConnectButton = () => {
  const router = useRouter();
  return (
    <RainbowConnectButton.Custom>
      {({ account, chain, openChainModal, openConnectModal, mounted }) => {
        const connected = mounted && account && chain;
        // after successful connection, redirect to /my-rewards
        if (connected && !chain.unsupported) {
          setTimeout(() => router.push('/my-rewards'), 1);
        }

        return (
          <div
            className={styles.connectButtonContainer}
            {...(!mounted && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    type="button"
                    onClick={openConnectModal}
                    className={styles.connectButton}
                  >
                    Connect
                  </button>
                );
              }
              if (chain.unsupported) {
                return (
                  <button
                    type="button"
                    onClick={openChainModal}
                    className={styles.wrongNetworkButton}
                  >
                    Wrong network
                  </button>
                );
              }
              return (
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    type="button"
                    disabled
                    className={styles.connectButton}
                  >
                    Connecting...
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </RainbowConnectButton.Custom>
  )
};
