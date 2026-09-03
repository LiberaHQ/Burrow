import Link from "next/link";
import { DocLayout, Callout, Steps } from "@/components/docs/DocLayout";

export const metadata = { title: "iOS + Android" };

const toc = [
  { id: "why-different", title: "Why this is its own page" },
  { id: "android-side", title: "Android side" },
  { id: "ios-side", title: "iOS side" },
  { id: "handshake", title: "The first handshake" },
] as const;

export default function Page() {
  return (
    <DocLayout
      section="tutorials"
      href="/tutorials/pairing/ios-android"
      title="iOS + Android"
      toc={toc}
    >
      <h2 id="why-different">Why this is its own page</h2>
      <p>
        The Bluetooth link itself is identical between platforms. What differs is the permission model
        and how each OS treats an app that is not in the foreground. Get those right and a cross-
        platform pair behaves exactly like a same-platform one.
      </p>
      <Callout type="note">
        iOS builds are not distributable yet — this page assumes a developer-provisioned build on the
        iOS device. See <Link href="/docs/getting-started/install">Install</Link>.
      </Callout>

      <h2 id="android-side">Android side</h2>
      <Steps>
        <li>Grant the &ldquo;nearby devices&rdquo; permission when Burrow asks.</li>
        <li>On Android 11 and earlier, also grant location — scanning is gated behind it at the OS level.</li>
        <li>Disable battery optimisation for Burrow if you want it to keep relaying with the screen off.</li>
      </Steps>

      <h2 id="ios-side">iOS side</h2>
      <Steps>
        <li>Allow Bluetooth for Burrow at the first prompt.</li>
        <li>Keep the app in the foreground for the initial pairing — background Bluetooth on iOS is limited.</li>
        <li>If nothing appears, toggle Bluetooth off and on in Control Centre and reopen the peers view.</li>
      </Steps>

      <h2 id="handshake">The first handshake</h2>
      <p>
        With both devices scanning and advertising, each should list the other within a few seconds.
        Open a conversation from either side and send a message; the identity exchange and encryption
        setup happen automatically on that first message. From then on the two recognise each other
        regardless of display-name changes.
      </p>
    </DocLayout>
  );
}
