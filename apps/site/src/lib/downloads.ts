export const VERSION = "0.1.1";

export interface DownloadOption {
  id: string;
  label: string;
  meta: string;
  note: string;
  href: string | null; // null = not yet available
  /** Shown as a distinct, more prominent callout below the note — for
   *  install steps that are easy to get stuck on (e.g. an OS security
   *  prompt), not just background info. */
  installSteps?: string[];
  /** Overrides the default "Download" button label — e.g. for a source
   *  tarball that needs building rather than a ready-to-run binary. */
  buttonLabel?: string;
}

export const DESKTOP_DOWNLOADS: DownloadOption[] = [
  {
    id: "macos",
    label: "macOS",
    meta: "Apple Silicon · .dmg · ~99 MB",
    note: "Signed with a personal development certificate, not notarized by Apple (that requires a paid Apple Developer account) — macOS will block it on first open.",
    href: "/downloads/Burrow-0.1.1-arm64.dmg",
    installSteps: [
      "Open the .dmg and drag Burrow into Applications",
      "macOS will say it \"cannot be opened\" — click Done, don't move it to Trash",
      "Right-click (or Control-click) Burrow in Applications → Open",
      "Click Open again in the dialog that appears — only needed the first time",
    ],
  },
  {
    id: "linux",
    label: "Linux",
    meta: "Source · .tar.gz · ~200 KB · Debian/Ubuntu",
    note: "Bluetooth support needs to be compiled on Linux itself, so there's no single prebuilt binary that works everywhere — this is the same source used to build and verify a working .deb (real BLE central + peripheral, end-to-end tested) on Ubuntu.",
    href: "/downloads/burrow-source.tar.gz",
    buttonLabel: "Download source",
    installSteps: [
      "Extract it, then from the extracted folder: sudo apt update && sudo apt install -y build-essential python3 libudev-dev bluez",
      "Install pnpm if you don't have it: curl -fsSL https://get.pnpm.io/install.sh | sh -",
      "Run ./apps/desktop/linux-build/build-deb.sh — this compiles Bluetooth support correctly for your machine",
      "sudo apt install ./apps/desktop/release/Burrow-*.deb, then run: /opt/Burrow/burrow --no-sandbox",
    ],
  },
];

export const MOBILE_DOWNLOADS: DownloadOption[] = [
  {
    id: "android",
    label: "Android",
    meta: "Release build · .apk · ~57 MB · Android 7.0+",
    note: "Unsigned (debug-keystore) build for sideloading — you'll need to allow installs from unknown sources. Includes real Bluetooth central + peripheral support (scan, connect, and advertise), tested end-to-end on real hardware.",
    href: "/downloads/burrow-release.apk",
  },
  {
    id: "ios",
    label: "iOS",
    meta: "Not distributable yet",
    note: "iOS apps outside the App Store need a paid Apple Developer account to distribute — this build only runs on devices registered to the developer's own account.",
    href: null,
  },
];
