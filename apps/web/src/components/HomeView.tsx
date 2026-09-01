"use client";

import type { Burrow } from "@/hooks/useBurrow";
import type { ViewId } from "@/lib/viewTypes";
import { BroadcastIcon, ContactsIcon, MessagesIcon } from "./Icons";
import styles from "./DashboardViews.module.css";

export function HomeView({
  rs,
  onNavigate,
  onOpenChat,
}: {
  rs: Burrow;
  onNavigate: (view: ViewId) => void;
  onOpenChat: (id: string) => void;
}) {
  const contacts = rs.peers.filter((p) => p.identityHash);
  const recentPeers = [...rs.peers].sort((a, b) => b.lastSeen - a.lastSeen).slice(0, 5);

  const recentMessages = [...rs.messages.entries()]
    .flatMap(([peerId, list]) => list.map((m) => ({ ...m, peerId })))
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  const peerName = (id: string) => rs.peers.find((p) => p.id === id)?.name ?? id;

  return (
    <div className={styles.page}>
      <div className={styles.actionRow}>
        <button className={styles.actionButton} onClick={() => onNavigate("messages")}>
          <MessagesIcon size={16} /> New Message
        </button>
        <button className={styles.actionButton} onClick={() => onNavigate("peers")}>
          <ContactsIcon size={16} /> Add Connection
        </button>
        <button
          className={styles.actionButton}
          onClick={() => {
            rs.startScan();
            onNavigate("peers");
          }}
        >
          <BroadcastIcon size={16} /> Announce
        </button>
      </div>

      <div className={styles.cardGrid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Recent Messages</h2>
            <button className={styles.cardLink} onClick={() => onNavigate("messages")}>
              View all
            </button>
          </div>
          {recentMessages.length === 0 ? (
            <div className={styles.cardEmpty}>
              <strong>No messages yet</strong>
              <span>Send your first encrypted message</span>
            </div>
          ) : (
            <div className={styles.cardBody}>
              {recentMessages.map((m, i) => (
                <div key={i} className={styles.row} onClick={() => onOpenChat(m.peerId)}>
                  <div className={styles.rowMain}>
                    <div className={styles.rowTitle}>{peerName(m.peerId)}</div>
                    <div className={styles.rowSub}>{m.text}</div>
                  </div>
                  {!m.delivered && <span className={styles.rowBadgeMuted}>queued</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Contacts</h2>
            <button className={styles.cardLink} onClick={() => onNavigate("peers")}>
              +
            </button>
          </div>
          {contacts.length === 0 ? (
            <div className={styles.cardEmpty}>
              <strong>No contacts yet</strong>
            </div>
          ) : (
            <div className={styles.cardBody}>
              {contacts.slice(0, 5).map((peer) => (
                <div key={peer.id} className={styles.row} onClick={() => onOpenChat(peer.id)}>
                  <div className={styles.rowMain}>
                    <div className={styles.rowTitle}>{peer.name ?? peer.id}</div>
                    <div className={styles.rowSub}>{peer.identityHash}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`${styles.card} ${styles.cardGridFull}`}>
          <div className={styles.cardHeader}>
            <h2>Recent Peers</h2>
            <button className={styles.cardLink} onClick={() => onNavigate("peers")}>
              View all →
            </button>
          </div>
          {recentPeers.length === 0 ? (
            <div className={styles.cardEmpty}>
              <strong>No peers discovered yet</strong>
            </div>
          ) : (
            <div className={styles.cardBody}>
              {recentPeers.map((peer) => (
                <div key={peer.id} className={styles.row} onClick={() => onOpenChat(peer.id)}>
                  <div className={styles.rowMain}>
                    <div className={styles.rowTitle}>{peer.name ?? peer.id}</div>
                    <div className={styles.rowSub}>
                      {peer.rssi} dBm · {peer.connected ? "connected" : "not connected"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
