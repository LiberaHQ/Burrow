import Link from "next/link";
import { DocLayout, Callout } from "@/components/docs/DocLayout";

export const metadata = { title: "Networking" };

const toc = [
  { id: "range", title: "Range in practice" },
  { id: "interference", title: "Interference and density" },
  { id: "permissions", title: "Platform permissions" },
  { id: "background", title: "Background behaviour" },
] as const;

export default function Page() {
  return (
    <DocLayout section="docs" href="/docs/networking" title="Networking" toc={toc}>
      <p>
        Burrow&apos;s only transport is Bluetooth LE. Understanding its limits is most of what it
        takes to get a reliable mesh.
      </p>

      <h2 id="range">Range in practice</h2>
      <ul>
        <li>Open air, line of sight: often 30–50 m between two phones.</li>
        <li>Through one interior wall: expect that to roughly halve.</li>
        <li>Bodies count as obstacles — a dense crowd shortens links noticeably.</li>
      </ul>
      <p>
        Plan for the short end of those numbers and let <Link href="/docs/concepts/mesh">relaying</Link>{" "}
        cover the gaps.
      </p>

      <h2 id="interference">Interference and density</h2>
      <p>
        Bluetooth LE shares the 2.4 GHz band with Wi-Fi and lots of other devices. In a busy venue
        that mostly shows up as slower discovery and more retries, not total failure. More
        participating devices generally helps reach even as it adds noise.
      </p>

      <h2 id="permissions">Platform permissions</h2>
      <ul>
        <li><strong>macOS</strong> — Bluetooth permission is per-app under Privacy &amp; Security.</li>
        <li><strong>Linux</strong> — the user needs access to BlueZ; the build script sets this up.</li>
        <li><strong>Android</strong> — nearby-devices and (on some versions) location permission are required for scanning.</li>
      </ul>

      <h2 id="background">Background behaviour</h2>
      <Callout type="note">
        Mobile operating systems throttle or suspend Bluetooth for backgrounded apps. For now, treat
        Burrow as something that works while it is open and on screen; relays are most dependable on a
        device that is plugged in and awake.
      </Callout>
    </DocLayout>
  );
}
