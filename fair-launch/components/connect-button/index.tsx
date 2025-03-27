"use client";

import clsx from "clsx";
import { css } from "styled-system/css";
import { useRouter } from "next/navigation";
import { ConnectButton as ConnectButtonRainbow } from "@rainbow-me/rainbowkit";
import * as styles from "./styles";

export const ConnectButton = () => {
  const router = useRouter();
  return (
    <ConnectButtonRainbow.Custom>
      {({ account, chain, openChainModal, openConnectModal, mounted }) => {
        const ready = mounted;
        const connected = ready && account && chain;
        // after successful connection, redirect to /my-rewards
        if (connected && !chain.unsupported) {
          setTimeout(() => {
            router.push('/my-rewards')
          }, 1);
        }

        return (
          <div
            className={styles.connectButtonContainer}
            {...(!ready && {
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
                    onClick={openChainModal}
                    type="button"
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
                    className={clsx(styles.connectButton, css({
                      display: "flex",
                      justifyContent: 'center',
                      alignItems: "center",
                      textAlign: 'center',
                      '&:disabled': {
                        cursor: 'not-allowed',
                        opacity: 0.85,
                      }
                    }))}
                  >
                    Connecting...
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButtonRainbow.Custom>
  )
};
