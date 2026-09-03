"use client";

import Link from "next/link";
import { BurrowLogo, CheckIcon } from "@/components/Icons";
import { MeshArt } from "@/components/MeshArt";
import { DownloadSection } from "@/components/DownloadSection";
import { AppPreview, HowItWorks, AboutProject, PrivatePayments } from "@/components/home/HomeSections";
import styles from "./page.module.css";

// Scrolls to a section without letting the browser's default anchor
// navigation touch the URL bar (no #hash appended/changed).
function scrollToSection(e: React.MouseEvent, id: string) {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const FEATURES = [
  { title: "No Account Required", sub: "Open the app and start chatting" },
  { title: "End-to-End Encrypted", sub: "Every message, always" },
  { title: "Mesh & Relay", sub: "Messages hop through nearby peers" },
  { title: "Free & Open", sub: "No subscriptions, ever" },
];

export default function Home() {
  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <div className={styles.brand}>
          <BurrowLogo size={26} />
          <span>BURROW</span>
        </div>
        <div className={styles.navLinks}>
          <a className={styles.navLinkActive} href="#top" onClick={(e) => scrollToSection(e, "top")}>
            Home
          </a>
          <Link className={styles.navLink} href="/docs">
            Docs
          </Link>
          <Link className={styles.navLink} href="/tutorials">
            Tutorials
          </Link>
          <a className={styles.navLink} href="#download" onClick={(e) => scrollToSection(e, "download")}>
            Download
          </a>
        </div>
        <div className={styles.navSpacer} />
      </nav>

      <section id="top" className={styles.hero}>
        <div className={styles.heroTop}>
          <div className={styles.heroText}>
            <h1 className={styles.headline}>
              Chat off the grid.
              <br />
              <span className={styles.headlineAccent}>No signal required.</span>
            </h1>
            <p className={styles.subtext}>
              Burrow is an encrypted chat mesh that runs entirely over Bluetooth LE — no accounts, no
              servers, no internet connection. Messages hop peer to peer until they reach who they&apos;re
              addressed to.
            </p>
            <div className={styles.ctaRow}>
              <a className={styles.primaryButton} href="#download" onClick={(e) => scrollToSection(e, "download")}>
                Download Burrow
              </a>
            </div>
          </div>
          <div className={styles.meshArt}>
            <MeshArt />
          </div>
        </div>

        <div className={styles.features}>
          {FEATURES.map((f) => (
            <div key={f.title} className={styles.feature}>
              <div className={styles.featureIcon}>
                <CheckIcon />
              </div>
              <div className={styles.featureTitle}>{f.title}</div>
              <div className={styles.featureSub}>{f.sub}</div>
            </div>
          ))}
        </div>
      </section>

      <AppPreview />
      <HowItWorks />
      <PrivatePayments />
      <AboutProject />

      <DownloadSection />

      <footer className={styles.footer}>
        <span>Burrow — built on Bluetooth LE, not the cloud.</span>
        <span className={styles.footerLinks}>
          <a href="https://x.com/BurrowChat" target="_blank" rel="noreferrer">
            X
          </a>
          <a href="https://github.com/LiberaHQ/Burrow" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </span>
      </footer>
    </div>
  );
}
