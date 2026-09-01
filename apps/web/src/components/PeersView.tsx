"use client";

import type { Burrow } from "@/hooks/useBurrow";
import styles from "./DashboardViews.module.css";

export function PeersView({ rs, onOpenChat }: { rs: Burrow; onOpenChat: (id: string) => void }) {
  return (
    <div className={styles.page}>
      <div className={styles.pageTitle}>Peers</div>

      <div className={styles.actionRow}>
        <button className={styles.actionButton} onClick={() => (rs.scanning ? rs.stopScan() : rs.startScan())}>
          {rs.scanning ? "Stop scanning" : "Start scanning"}
        </button>
        {rs.peripheralSupported && (
          <button
            className={styles.actionButton}
            onClick={() => (rs.advertising ? rs.stopAdvertising() : rs.startAdvertising("Burrow"))}
          >
            {rs.advertising ? "Stop advertising" : "Start advertising"}
          </button>
        )}
      </div>

      {rs.advertisingError && <div className={styles.rowErrorBanner}>{rs.advertisingError}</div>}

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>Discovered peers · bt: {rs.adapterState}</h2>
        </div>
        {rs.peers.length === 0 ? (
          <div className={styles.cardEmpty}>
            <strong>No peers discovered yet</strong>
            <span>Start scanning to find nearby Bluetooth devices.</span>
          </div>
        ) : (
          <div className={styles.cardBody}>
            {rs.peers.map((peer) => {
              const error = rs.peerErrors.get(peer.id);
              const connecting = rs.connectingPeerId === peer.id;
              return (
                <div key={peer.id}>
                  <div className={styles.row} onClick={() => onOpenChat(peer.id)}>
                    <div className={styles.rowMain}>
                      <div className={styles.rowTitle}>{peer.name ?? peer.id}</div>
                      <div className={styles.rowSub}>
                        {peer.role === "peripheral" ? "incoming" : "scanned"} · {peer.rssi} dBm · {peer.id}
                      </div>
                    </div>
                    {peer.role === "central" &&
                      (peer.connected || connecting ? (
                        <button
                          className={styles.cardLink}
                          onClick={(e) => {
                            e.stopPropagation();
                            rs.disconnectPeer(peer.id);
                          }}
                        >
                          {connecting ? "Connecting… (cancel)" : "Disconnect"}
                        </button>
                      ) : (
                        <button
                          className={styles.cardLink}
                          onClick={(e) => {
                            e.stopPropagation();
                            rs.connectPeer(peer.id);
                          }}
                        >
                          Connect
                        </button>
                      ))}
                  </div>
                  {error && <div className={styles.rowErrorBanner}>{error}</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
