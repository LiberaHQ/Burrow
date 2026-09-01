"use client";

import type { OwnIdentity } from "@/lib/api";
import { CopyIcon } from "./Icons";
import styles from "./DashboardViews.module.css";

function copy(text: string) {
  navigator.clipboard?.writeText(text).catch(() => undefined);
}

export function IdentityView({ identity }: { identity: OwnIdentity | null }) {
  return (
    <div className={styles.page}>
      <div className={styles.pageTitle}>Identity</div>

      {!identity ? (
        <div className={styles.cardEmpty}>
          <span>Loading identity…</span>
        </div>
      ) : (
        <div className={styles.detailPanel}>
          <div className={styles.detailField}>
            <div className={styles.detailLabel}>Identity hash</div>
            <div className={styles.detailValueRow}>
              <span style={{ flex: 1, overflowWrap: "anywhere" }}>{identity.hash}</span>
              <button className={styles.copyButton} onClick={() => copy(identity.hash)} title="Copy">
                <CopyIcon />
              </button>
            </div>
          </div>

          <div className={styles.detailField}>
            <div className={styles.detailLabel}>Public key</div>
            <div className={styles.detailValueRow}>
              <span style={{ flex: 1, overflowWrap: "anywhere" }}>{identity.publicKey}</span>
              <button className={styles.copyButton} onClick={() => copy(identity.publicKey)} title="Copy">
                <CopyIcon />
              </button>
            </div>
          </div>

          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            This is a NaCl (X25519) keypair generated on first run and stored at{" "}
            <code>~/.burrow/identity.json</code>. Messages are end-to-end encrypted to a peer&apos;s public
            key, and peers are addressed by the hash above rather than by Bluetooth address.
          </p>
        </div>
      )}
    </div>
  );
}
