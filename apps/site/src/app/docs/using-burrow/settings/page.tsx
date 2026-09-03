import Link from "next/link";
import { DocLayout, Callout } from "@/components/docs/DocLayout";

export const metadata = { title: "Settings" };

const toc = [
  { id: "identity", title: "Identity" },
  { id: "display-name", title: "Display name" },
  { id: "storage", title: "Storage & export" },
  { id: "bluetooth", title: "Bluetooth" },
] as const;

export default function Page() {
  return (
    <DocLayout section="docs" href="/docs/using-burrow/settings" title="Settings" toc={toc}>
      <p>Settings are local to the device. Nothing here syncs anywhere.</p>

      <h2 id="identity">Identity</h2>
      <p>
        Your keypair is generated on first run and stored in the app&apos;s local data. You can view
        its fingerprint, and you can regenerate it — but a new identity is a new person as far as the
        mesh is concerned, and existing contacts will not recognise it until you re-establish.
      </p>
      <Callout type="warning">
        There is no key recovery. If you lose the device or wipe the app data without an export, that
        identity and its conversation history cannot be restored.
      </Callout>

      <h2 id="display-name">Display name</h2>
      <p>
        Free-form text shown next to your identity to people who have not saved a name for you. Change
        it as often as you like; it does not affect addressing.
      </p>

      <h2 id="storage">Storage &amp; export</h2>
      <p>
        Conversations and contacts live in a local database. The settings screen shows how much space
        it uses and lets you export an encrypted archive you can move to another device, and clear
        individual conversations or everything.
      </p>

      <h2 id="bluetooth">Bluetooth</h2>
      <p>
        Controls for whether the device advertises (is discoverable), scans, and acts as a relay for
        traffic not addressed to it. Turning off relay saves battery but weakens the mesh for
        everyone nearby — more on that trade-off in{" "}
        <Link href="/docs/concepts/mesh">How the mesh works</Link>.
      </p>
    </DocLayout>
  );
}
