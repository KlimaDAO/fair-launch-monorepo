"use client";

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
        if (connected) {
          setTimeout(() => {
            router.push('/my-rewards')
          }, 1);
        }

        return (
          <div
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
                    onClick={openConnectModal}
                    type="button"
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
                    onClick={openChainModal}
                    style={{ display: "flex", alignItems: "center" }}
                    type="button"
                    className={styles.connectButton}
                  >
                    {account.displayName}
                    {account.displayBalance ? ` (${account.displayBalance})` : ""}
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
