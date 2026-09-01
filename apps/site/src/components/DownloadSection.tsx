"use client";

import { useState } from "react";
import { DESKTOP_DOWNLOADS, MOBILE_DOWNLOADS, VERSION, type DownloadOption } from "@/lib/downloads";
import styles from "@/app/page.module.css";
import { DownloadIcon, MonitorIcon, SmartphoneIcon } from "./Icons";

export function DownloadSection() {
  const [tab, setTab] = useState<"desktop" | "mobile">("desktop");
  const options = tab === "desktop" ? DESKTOP_DOWNLOADS : MOBILE_DOWNLOADS;

  return (
    <section id="download" className={styles.downloadSection}>
      <div className={styles.sectionHeading}>
        <h2 className={styles.sectionTitle}>Get Burrow</h2>
        <p className={styles.sectionSub}>Version {VERSION} · desktop and mobile</p>
      </div>

      <div className={styles.tabRow}>
        <button
          className={tab === "desktop" ? styles.tabActive : styles.tab}
          onClick={() => setTab("desktop")}
        >
          <MonitorIcon size={16} />
          Desktop
        </button>
        <button className={tab === "mobile" ? styles.tabActive : styles.tab} onClick={() => setTab("mobile")}>
          <SmartphoneIcon size={16} />
          Mobile
        </button>
      </div>

      <div className={styles.cardGrid}>
        {options.map((opt) => (
          <DownloadCard key={opt.id} option={opt} />
        ))}
      </div>
    </section>
  );
}

function DownloadCard({ option }: { option: DownloadOption }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <div className={styles.cardIcon}>
          <DownloadIcon size={18} />
        </div>
        <div>
          <div className={styles.cardTitle}>{option.label}</div>
          <div className={styles.cardMeta}>{option.meta}</div>
        </div>
      </div>
      <p className={styles.cardNote}>{option.note}</p>
      {option.installSteps && (
        <div className={styles.installBox}>
          <div className={styles.installBoxTitle}>How to open it</div>
          <ol className={styles.installSteps}>
            {option.installSteps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      )}
      {option.href ? (
        <a className={styles.cardButton} href={option.href} download>
          <DownloadIcon size={16} />
          {option.buttonLabel ?? "Download"}
        </a>
      ) : (
        <span className={styles.cardButtonDisabled}>Coming soon</span>
      )}
    </div>
  );
}
