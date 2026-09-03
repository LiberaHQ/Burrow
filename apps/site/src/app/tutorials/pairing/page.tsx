import Link from "next/link";
import { DocLayout, Callout, Steps } from "@/components/docs/DocLayout";

export const metadata = { title: "Pairing your first device" };

const toc = [
  { id: "goal", title: "Goal" },
  { id: "you-will-need", title: "You will need" },
  { id: "steps", title: "Steps" },
  { id: "troubleshooting", title: "If they don't see each other" },
] as const;

export default function Page() {
  return (
    <DocLayout
      section="tutorials"
      href="/tutorials/pairing"
      title="Pairing your first device"
      toc={toc}
    >
      <h2 id="goal">Goal</h2>
      <p>
        Two devices exchanging a message over Bluetooth LE with nothing else set up — no network, no
        accounts, no configuration.
      </p>

      <h2 id="you-will-need">You will need</h2>
      <ul>
        <li>Two devices with Burrow installed (<Link href="/docs/getting-started/install">Install</Link>).</li>
        <li>Both within a few metres of each other for this first run.</li>
        <li>Bluetooth on and permission granted on both.</li>
      </ul>

      <h2 id="steps">Steps</h2>
      <Steps>
        <li>Launch Burrow on both devices and set a display name when prompted.</li>
        <li>Open the peers view on each. Both scan and advertise at once, so each should list the other within a few seconds.</li>
        <li>On one device, tap the other&apos;s entry to open a conversation.</li>
        <li>Send a message and watch it move from queued to sent to delivered.</li>
        <li>Reply from the second device to confirm the round trip.</li>
      </Steps>

      <Callout type="tip">
        Keep both screens unlocked during the first pairing. Several platforms suspend Bluetooth the
        moment an app is backgrounded or the device locks.
      </Callout>

      <h2 id="troubleshooting">If they don&apos;t see each other</h2>
      <ul>
        <li>Move the devices closer and wait 15–20 seconds for a discovery cycle.</li>
        <li>Confirm Bluetooth permission for Burrow in the OS settings — a silent denial looks exactly like &ldquo;no peers nearby&rdquo;.</li>
        <li>Restart scanning by leaving and re-opening the peers view.</li>
      </ul>
      <p>
        Cross-platform pairs (for example iPhone to Android) have a couple of extra wrinkles — see{" "}
        <Link href="/tutorials/pairing/ios-android">iOS + Android</Link>.
      </p>
    </DocLayout>
  );
}
