import Link from "next/link";
import styles from "./home.module.css";

/* ---------- small inline icons ---------- */

const ico = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function KeyIcon() {
  return (
    <svg {...ico}>
      <circle cx="8" cy="15" r="4" />
      <path d="M10.8 12.2 20 3m-3 3 2 2m-4 0 2 2" />
    </svg>
  );
}
function HandshakeIcon() {
  return (
    <svg {...ico}>
      <path d="m11 17 2 2a1 1 0 0 0 3-3" />
      <path d="m14 14 2.5 2.5a1 1 0 0 0 3-3l-3.9-3.9a2 2 0 0 1 0-2.8L21 3" />
      <path d="m3 21 3-3 2 2a1 1 0 0 0 3-3l-4-4a2 2 0 0 1 0-2.8L14 3" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg {...ico}>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
function RelayIcon() {
  return (
    <svg {...ico}>
      <circle cx="5" cy="12" r="2.5" />
      <circle cx="19" cy="5" r="2.5" />
      <circle cx="19" cy="19" r="2.5" />
      <path d="m7.2 10.8 9.6-4.6m0 11.6L7.2 13.2" />
    </svg>
  );
}
function ArrowUpIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  );
}
function BookIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22.5z" />
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    </svg>
  );
}
function GithubGlyph() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.6v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .4.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5Z" />
    </svg>
  );
}
function XGlyph() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/* ---------- App preview ---------- */

const PEERS = [
  { initials: "MK", name: "mara", hash: "#7f2a", active: true },
  { initials: "JD", name: "jules", hash: "#c14e", active: false },
  { initials: "AN", name: "ari", hash: "#0b9d", active: false },
];

export function AppPreview() {
  return (
    <section id="preview" className={styles.section}>
      <div className={styles.heading}>
        <span className={styles.eyebrow}>A look at the app</span>
        <h2 className={styles.title}>Familiar chat, no account behind it</h2>
        <p className={styles.sub}>
          Peers show up as you come into Bluetooth range. Each one carries a short identity hash and a{" "}
          <strong>secured</strong> badge once keys are exchanged. Messages you send while a peer is out
          of range wait in the outbox and deliver themselves later.
        </p>
      </div>

      <div className={styles.previewFrame}>
        <div className={styles.previewBar}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.previewBarTitle}>Burrow</span>
        </div>
        <div className={styles.previewBody}>
          <div className={styles.previewSidebar}>
            <div className={styles.previewSidebarHead}>Peers nearby</div>
            {PEERS.map((p) => (
              <div key={p.hash} className={p.active ? styles.peerActive : styles.peer}>
                <span className={styles.peerAvatar}>{p.initials}</span>
                <span className={styles.peerMeta}>
                  <span className={styles.peerName}>{p.name}</span>
                  <span className={styles.peerHash}>{p.hash}</span>
                </span>
                <span className={styles.securedPill}>secured</span>
              </div>
            ))}
          </div>

          <div className={styles.previewChat}>
            <div className={styles.previewChatHead}>
              <span className={styles.previewChatName}>mara</span>
              <span className={styles.previewChatTag}>secured (7f2a1c)</span>
            </div>
            <div className={styles.previewMessages}>
              <div className={styles.bubbleIn}>anyone on channel 4? cell&apos;s dead in here</div>
              <div className={styles.bubbleOut}>here — third floor by the stairwell</div>
              <div className={styles.bubbleIn}>nice. can you relay for the folks in the basement?</div>
              <div className={styles.bubbleWrap}>
                <div className={styles.bubbleQueued}>bringing the antenna up, give me a sec</div>
                <span className={styles.queuedLabel}>queued — mara is out of range</span>
              </div>
            </div>
            <div className={styles.previewInput}>
              Message
              <span className={styles.previewSend}>
                <ArrowUpIcon />
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className={styles.previewNote}>Illustration of the desktop client. The real UI is in the download.</p>
    </section>
  );
}

/* ---------- How it works ---------- */

const STEPS = [
  {
    icon: <KeyIcon />,
    title: "You get an identity, not an account",
    body: "On first run Burrow generates a NaCl keypair on the device. You're addressed by a short hash of the public key — no email, no phone number, nothing to sign up for.",
  },
  {
    icon: <HandshakeIcon />,
    title: "Peers handshake over Bluetooth",
    body: "When two devices come into range they exchange public keys in a hello envelope. From then on each knows how to encrypt to the other.",
  },
  {
    icon: <LockIcon />,
    title: "Every message is sealed",
    body: "Chat messages are encrypted with nacl.box (X25519 + XSalsa20-Poly1305) to the recipient's key before they leave your device. Nothing travels as plaintext.",
  },
  {
    icon: <RelayIcon />,
    title: "Relay and store-and-forward",
    body: "Out of range? The message queues in a persistent outbox and delivers on reconnect. In range of a shared peer? That peer forwards the still-encrypted envelope onward, up to 8 hops.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className={styles.sectionAlt}>
      <div className={styles.heading}>
        <span className={styles.eyebrow}>How it works</span>
        <h2 className={styles.title}>Keys on the device, ciphertext on the air</h2>
        <p className={styles.sub}>
          There is no server in the path — because there is no server at all. Four moving parts do the
          whole job.
        </p>
      </div>

      <div className={styles.steps}>
        {STEPS.map((s, i) => (
          <div key={s.title} className={styles.step}>
            <span className={styles.stepIcon}>{s.icon}</span>
            <span className={styles.stepNum}>STEP {i + 1}</span>
            <span className={styles.stepTitle}>{s.title}</span>
            <span className={styles.stepBody}>{s.body}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Built in the open ---------- */

const FACTS = [
  { key: "Platforms", val: "macOS · Linux · Android" },
  { key: "iOS", val: "In progress" },
  { key: "Transport", val: "Bluetooth LE (Nordic UART Service)" },
  { key: "Crypto", val: "NaCl box — X25519 / XSalsa20-Poly1305" },
  { key: "Mesh", val: "Flood relay, TTL 8 · persistent outbox" },
  { key: "License", val: "Open source" },
];

export function AboutProject() {
  return (
    <section id="about" className={styles.section}>
      <div className={styles.aboutGrid}>
        <div className={styles.aboutText}>
          <h2>Built in the open</h2>
          <p>
            Burrow is a small monorepo: a background service that owns the Bluetooth radio, a chat UI,
            and desktop and mobile shells around it. The mesh layer — identity, encryption,
            store-and-forward, and relay — is inspired by Reticulum, scoped down to fit inside one app.
          </p>
          <p>
            It is pre-1.0 and moving. The docs track what actually works today versus what is still
            planned, and the tutorials walk through real setups from a two-device pair to a
            building-wide mesh.
          </p>
          <div className={styles.aboutActions}>
            <Link className={styles.aboutBtnPrimary} href="/docs">
              <BookIcon />
              Read the docs
            </Link>
            <Link className={styles.aboutBtn} href="/tutorials">
              Browse tutorials
            </Link>
            <a
              className={styles.aboutBtn}
              href="https://github.com/LiberaHQ/Burrow"
              target="_blank"
              rel="noreferrer"
            >
              <GithubGlyph />
              View source
            </a>
            <a
              className={styles.aboutBtn}
              href="https://x.com/BurrowChat"
              target="_blank"
              rel="noreferrer"
            >
              <XGlyph />
              Follow on X
            </a>
          </div>
        </div>

        <div className={styles.factList}>
          {FACTS.map((f) => (
            <div key={f.key} className={styles.fact}>
              <span className={styles.factKey}>{f.key}</span>
              <span className={styles.factVal}>{f.val}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Roadmap: private per-device payments ---------- */

const PAY_FLOW = [
  {
    title: "You hit Send Payment in a chat",
    body: (
      <>
        Burrow never asks the recipient for an address. They shared one{" "}
        <em>stealth meta-address</em> when you first connected — like handing over a handle once — and
        that is all the app needs.
      </>
    ),
  },
  {
    title: "A one-time address is derived on the spot",
    body: (
      <>
        From their meta-address, your device computes a fresh address that is mathematically linked to
        them but looks completely random to anyone else. It has never appeared on-chain before.
      </>
    ),
  },
  {
    title: "Funds go to that address",
    body: (
      <>
        A normal transaction on <strong>Robinhood</strong> to a never-seen wallet — no name, no link
        to the recipient&apos;s usual address, no link to your last payment to them.
      </>
    ),
  },
  {
    title: "An encrypted announcement rides along",
    body: (
      <>
        Alongside the transfer, Burrow posts a small hint: <em>&ldquo;someone with the right key —
        check this address.&rdquo;</em> It is on-chain too, but only the intended recipient can
        decrypt it, using their private <em>viewing key</em>.
      </>
    ),
  },
  {
    title: "The recipient's app quietly finds it",
    body: (
      <>
        Background scanning checks each announcement against their key. On a match it surfaces{" "}
        <em>you received a payment</em> and reveals how to spend it. They can sweep it into their main
        wallet whenever they want, or leave it. To everyone else, that scan is invisible.
      </>
    ),
  },
];

const PAY_TAKEAWAYS = [
  {
    title: "No recurring address, no graph",
    body: "Every payment lands somewhere new, so an outside observer can't cluster thirty payments as \"all to the same person\" — the money trail stops re-exposing the social graph the chat encryption protects.",
  },
  {
    title: "Not a mixer",
    body: "Nothing is pooled or obfuscated after the fact. It's an ordinary public chain; you're not hiding that a transaction happened, only who it was for — the addressing is just done differently up front.",
  },
  {
    title: "Why Robinhood",
    body: "The recipient has to scan every announcement to find the ones meant for them. On mainnet that's slow and expensive; Robinhood's low fees make both posting and scanning cheap enough to run inside a normal chat app.",
  },
];

export function PrivatePayments() {
  return (
    <section id="payments" className={styles.sectionAlt}>
      <div className={styles.heading}>
        <h2 className={styles.title}>A private wallet on every device</h2>
      </div>
      <p className={styles.roadmapLede}>
        Encrypted chat protects your messages, but if payments always go to the same on-chain address,
        the money trail alone rebuilds who is paying whom. The plan: give each payment a fresh,
        one-time address that only the recipient can recognise as theirs — a per-device wallet with{" "}
        <strong>stealth-address payments</strong> built in.
      </p>

      <ol className={styles.flow}>
        {PAY_FLOW.map((s) => (
          <li key={s.title} className={styles.flowStep}>
            <div className={styles.flowTitle}>{s.title}</div>
            <div className={styles.flowBody}>{s.body}</div>
          </li>
        ))}
      </ol>

      <div className={styles.takeaways}>
        {PAY_TAKEAWAYS.map((t) => (
          <div key={t.title} className={styles.takeaway}>
            <span className={styles.takeawayTitle}>{t.title}</span>
            <span className={styles.takeawayBody}>{t.body}</span>
          </div>
        ))}
      </div>

      <p className={styles.disclaimer}>
        This is a design we&apos;re working toward, not a feature in the app today. Keys and wallet
        stay on the device — nothing custodial, no shared server.
      </p>
    </section>
  );
}
