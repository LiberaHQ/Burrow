"use client";

import { useState } from "react";
import type { Burrow } from "@/hooks/useBurrow";
import styles from "./MessagesView.module.css";

export function MessagesView({
  rs,
  selectedId,
  onSelect,
}: {
  rs: Burrow;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [draft, setDraft] = useState("");

  const selectedPeer = rs.peers.find((p) => p.id === selectedId) ?? null;
  const thread = selectedId ? (rs.messages.get(selectedId) ?? []) : [];
  const selectedError = selectedId ? rs.peerErrors.get(selectedId) : undefined;
  const isConnecting = selectedId !== null && rs.connectingPeerId === selectedId;

  const handleSend = () => {
    if (!selectedId || !draft.trim()) return;
    rs.sendMessage(selectedId, draft.trim());
    setDraft("");
  };

  return (
    <div className={styles.body}>
      <aside className={styles.sidebar}>
        <button className={styles.scanButton} onClick={() => (rs.scanning ? rs.stopScan() : rs.startScan())}>
          {rs.scanning ? "Stop scanning" : "Start scanning"}
        </button>

        <ul className={styles.peerList}>
          {rs.peers.length === 0 && <li className={styles.emptyState}>No peers discovered yet.</li>}
          {rs.peers.map((peer) => (
            <li
              key={peer.id}
              className={peer.id === selectedId ? styles.peerItemActive : styles.peerItem}
              onClick={() => onSelect(peer.id)}
            >
              <div className={styles.peerName}>{peer.name ?? peer.id}</div>
              <div className={styles.peerMeta}>
                {peer.rssi} dBm · {peer.connected ? "connected" : "not connected"}
                {peer.identityHash && ` · secured (${peer.identityHash.slice(0, 8)})`}
              </div>
            </li>
          ))}
        </ul>
      </aside>

      <main className={styles.chat}>
        {!selectedPeer && <div className={styles.emptyState}>Select a peer to chat.</div>}

        {selectedPeer && (
          <>
            <div className={styles.chatHeader}>
              <div>
                <strong>{selectedPeer.name ?? selectedPeer.id}</strong>
                <span className={styles.peerMeta}>
                  {" "}
                  · {selectedPeer.rssi} dBm
                  {isConnecting
                    ? " · connecting…"
                    : selectedPeer.identityHash
                      ? ` · secured (${selectedPeer.identityHash.slice(0, 8)})`
                      : " · establishing secure connection…"}
                </span>
              </div>
              {selectedPeer.role === "central" &&
                (selectedPeer.connected || isConnecting ? (
                  <button onClick={() => rs.disconnectPeer(selectedPeer.id)}>
                    {isConnecting ? "Cancel" : "Disconnect"}
                  </button>
                ) : (
                  <button onClick={() => rs.connectPeer(selectedPeer.id)}>Connect</button>
                ))}
            </div>

            {selectedError && <div className={styles.errorBanner}>{selectedError}</div>}

            <div className={styles.thread}>
              {thread.map((msg, i) => (
                <div key={i} className={msg.direction === "out" ? styles.bubbleOut : styles.bubbleIn}>
                  {msg.text}
                  {!msg.delivered && <span className={styles.queuedTag}> queued…</span>}
                </div>
              ))}
            </div>

            <div className={styles.composer}>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={
                  selectedPeer.identityHash
                    ? selectedPeer.connected
                      ? "Message…"
                      : "Message… (will queue until they're back online)"
                    : "Connect to establish a secure channel first"
                }
                disabled={!selectedPeer.identityHash}
              />
              <button onClick={handleSend} disabled={!selectedPeer.identityHash}>
                Send
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
