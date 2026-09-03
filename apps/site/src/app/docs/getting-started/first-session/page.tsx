import Link from "next/link";
import { DocLayout, Callout, Steps } from "@/components/docs/DocLayout";

export const metadata = { title: "Your first session" };

const toc = [
  { id: "set-a-display-name", title: "Set a display name" },
  { id: "find-a-peer", title: "Find a peer" },
  { id: "send-a-message", title: "Send a message" },
  { id: "what-just-happened", title: "What just happened" },
] as const;

export default function Page() {
  return (
    <DocLayout
      section="docs"
      href="/docs/getting-started/first-session"
      title="Your first session"
      toc={toc}
    >
      <p>
        This walks two devices in the same room through their first exchange. Both need Burrow
        installed (<Link href="/docs/getting-started/install">Install</Link>) and Bluetooth on. No
        network required.
      </p>

      <h2 id="set-a-display-name">Set a display name</h2>
      <p>
        On first run Burrow generates your identity keypair and asks for a display name. The name is
        just a label other people see next to your identity — it is not unique and not an account.
        You can change it later in <Link href="/docs/using-burrow/settings">Settings</Link>.
      </p>

      <h2 id="find-a-peer">Find a peer</h2>
      <Steps>
        <li>Open the peers view on both devices.</li>
        <li>Each device is advertising and scanning at the same time, so within a few seconds each should list the other.</li>
        <li>Tap the other device&apos;s entry to open a conversation.</li>
      </Steps>
      <Callout type="tip">
        If nothing shows up, put the devices closer together and make sure neither screen is locked —
        some platforms throttle Bluetooth hard in the background.
      </Callout>

      <h2 id="send-a-message">Send a message</h2>
      <p>
        Type something and send. You should see the message move through its delivery states —
        queued, sent, then delivered once the other device acknowledges it. Reply from the second
        device to confirm the round trip.
      </p>

      <h2 id="what-just-happened">What just happened</h2>
      <p>
        The two devices established a Bluetooth LE connection directly, negotiated encryption keyed to
        each identity, and exchanged the message with no other party involved. Add a third device out
        of range of the first and you will see the same message <em>relayed</em> — that is covered in{" "}
        <Link href="/docs/concepts/mesh">How the mesh works</Link>.
      </p>
    </DocLayout>
  );
}
