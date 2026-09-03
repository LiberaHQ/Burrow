import Link from "next/link";
import { DocLayout, Callout } from "@/components/docs/DocLayout";

export const metadata = { title: "How the mesh works" };

const toc = [
  { id: "roles", title: "Central and peripheral" },
  { id: "relay", title: "Relaying" },
  { id: "store-and-forward", title: "Store and forward" },
  { id: "limits", title: "Where it breaks down" },
] as const;

export default function Page() {
  return (
    <DocLayout section="docs" href="/docs/concepts/mesh" title="How the mesh works" toc={toc}>
      <p>
        The mesh is just devices running Burrow within Bluetooth range of each other, forwarding for
        one another. There are no designated servers or routers — every device does the same job.
      </p>

      <h2 id="roles">Central and peripheral</h2>
      <p>
        Bluetooth LE splits a connection into a <strong>central</strong> (scans, initiates) and a{" "}
        <strong>peripheral</strong> (advertises, accepts). Burrow runs both at once on every device,
        so any two devices can connect without deciding in advance which is which.
      </p>

      <h2 id="relay">Relaying</h2>
      <p>
        When a message cannot reach its destination directly, devices in between carry it. Each hop is
        another Burrow device that accepts the encrypted message and passes it on toward the
        recipient. Relayed devices cannot read the contents — they only see enough routing
        information to move it along.
      </p>
      <Callout type="note">
        Relaying is what turns a handful of short Bluetooth links into building-wide reach. It also
        means the health of the mesh depends on enough devices leaving relay enabled.
      </Callout>

      <h2 id="store-and-forward">Store and forward</h2>
      <p>
        If the next hop is not currently reachable, the carrying device holds the message and retries
        when peers come back into range. This is why a message can show &ldquo;sent&rdquo; for
        minutes — it is in transit on someone else&apos;s device, waiting for a link.
      </p>

      <h2 id="limits">Where it breaks down</h2>
      <ul>
        <li>No path of participating devices between sender and recipient — the message never leaves &ldquo;queued&rdquo;.</li>
        <li>Everyone in the chain has relay turned off.</li>
        <li>Devices are locked or backgrounded on platforms that suspend Bluetooth aggressively.</li>
      </ul>
      <p>
        Planning around those constraints is the subject of the{" "}
        <Link href="/tutorials/relaying">relaying tutorial</Link>.
      </p>
    </DocLayout>
  );
}
