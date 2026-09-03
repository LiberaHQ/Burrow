import Link from "next/link";
import { DocLayout, Callout } from "@/components/docs/DocLayout";

export const metadata = { title: "Hardware" };

const toc = [
  { id: "supported", title: "Supported platforms" },
  { id: "what-matters", title: "What matters for range" },
  { id: "relay-nodes", title: "Dedicated relay nodes" },
] as const;

export default function Page() {
  return (
    <DocLayout section="docs" href="/docs/hardware" title="Hardware" toc={toc}>
      <h2 id="supported">Supported platforms</h2>
      <ul>
        <li><strong>macOS</strong> — Apple Silicon, recent macOS.</li>
        <li><strong>Linux</strong> — Debian/Ubuntu with a BlueZ-supported adapter.</li>
        <li><strong>Android</strong> — 7.0 and later, with Bluetooth LE (essentially all modern devices).</li>
        <li><strong>iOS</strong> — builds exist but are not distributable yet.</li>
      </ul>
      <p>
        Any of these can talk to any other — a Mac and an Android phone mesh together with no
        difference in behaviour.
      </p>

      <h2 id="what-matters">What matters for range</h2>
      <p>
        Between two phones, the antenna and radio are fixed and roughly comparable across devices.
        Placement is the variable you control: height helps, keeping the device out of a pocket or
        bag helps, and a clear line between devices helps more than raw distance would suggest.
      </p>

      <h2 id="relay-nodes">Dedicated relay nodes</h2>
      <Callout type="tip">
        A cheap laptop or an always-on desktop left running Burrow in a fixed spot makes an excellent
        relay — it is not battery-constrained and not subject to mobile background limits. Two of
        them can bridge areas phones alone cannot, as in the{" "}
        <Link href="/tutorials/bridging">bridging tutorial</Link>.
      </Callout>
    </DocLayout>
  );
}
