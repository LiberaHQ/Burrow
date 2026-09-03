import Link from "next/link";
import { DocLayout, Callout, Steps } from "@/components/docs/DocLayout";

export const metadata = { title: "Install" };

const toc = [
  { id: "macos", title: "macOS" },
  { id: "linux", title: "Linux" },
  { id: "android", title: "Android" },
  { id: "ios", title: "iOS" },
  { id: "verifying", title: "Verifying it works" },
] as const;

export default function Page() {
  return (
    <DocLayout section="docs" href="/docs/getting-started/install" title="Install" toc={toc}>
      <p>
        Grab a build from the <Link href="/#download">download page</Link>. Every build is unsigned or
        signed with a personal certificate, so each platform has a first-launch prompt to get past —
        that is expected, and covered below.
      </p>

      <h2 id="macos">macOS</h2>
      <p>Apple Silicon, delivered as a <code>.dmg</code>. It is not notarized, so Gatekeeper blocks it on first open.</p>
      <Steps>
        <li>Open the <code>.dmg</code> and drag Burrow into Applications.</li>
        <li>macOS will say it &ldquo;cannot be opened&rdquo; — click Done, do not move it to Trash.</li>
        <li>Right-click (or Control-click) Burrow in Applications and choose Open.</li>
        <li>Click Open again in the dialog. This is only needed the first time.</li>
      </Steps>

      <h2 id="linux">Linux</h2>
      <p>
        Bluetooth support has to be compiled on Linux itself, so there is no single portable binary.
        The source archive builds and verifies a working <code>.deb</code> on Debian/Ubuntu.
      </p>
      <Steps>
        <li>Extract the archive.</li>
        <li>
          <code>sudo apt update &amp;&amp; sudo apt install -y build-essential python3 libudev-dev bluez</code>
        </li>
        <li>Run the build script under <code>apps/desktop/linux-build/</code>.</li>
        <li>Install the resulting <code>.deb</code> and launch Burrow.</li>
      </Steps>

      <h2 id="android">Android</h2>
      <p>
        Sideloaded <code>.apk</code>, Android 7.0+. You will need to allow installs from unknown
        sources for your browser or file manager, then open the file and confirm.
      </p>

      <h2 id="ios">iOS</h2>
      <p>
        Not distributable yet — App Store distribution needs a paid Apple Developer account. For now
        iOS builds only run on devices registered to the developer&apos;s own account.
      </p>

      <h2 id="verifying">Verifying it works</h2>
      <p>
        On first launch Burrow asks for Bluetooth permission. Grant it, then check that the peers view
        shows &ldquo;scanning&rdquo; rather than an error. If a second device nearby is also running
        Burrow, it should appear within a few seconds.
      </p>
      <Callout type="warning">
        If the app never leaves &ldquo;scanning&rdquo; and you are sure another device is in range,
        the platform likely denied Bluetooth silently. Re-check the OS privacy settings for Burrow —
        details per platform are in <Link href="/docs/networking">Networking</Link>.
      </Callout>
    </DocLayout>
  );
}
