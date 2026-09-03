import Link from "next/link";
import { DocLayout, Callout, Steps } from "@/components/docs/DocLayout";

export const metadata = { title: "Bridging two buildings" };

const toc = [
  { id: "goal", title: "Goal" },
  { id: "constraints", title: "The constraint" },
  { id: "plan", title: "Plan the bridge" },
  { id: "setup", title: "Setup" },
  { id: "verify", title: "Verify and harden" },
] as const;

export default function Page() {
  return (
    <DocLayout
      section="tutorials"
      href="/tutorials/bridging"
      title="Bridging two buildings"
      toc={toc}
    >
      <h2 id="goal">Goal</h2>
      <p>
        Join two separate Burrow clusters — one per building — into a single mesh, so anyone in
        either building can message anyone in the other.
      </p>

      <h2 id="constraints">The constraint</h2>
      <p>
        Bluetooth LE will not cross the gap between two buildings on its own. The bridge is a short
        chain of always-on relay devices positioned so that each can see the next, forming a path
        from one cluster to the other.
      </p>
      <Callout type="note">
        This is still all Bluetooth — there is no internet link involved. If the buildings are far
        apart, you need more relay hops, not a different transport.
      </Callout>

      <h2 id="plan">Plan the bridge</h2>
      <ul>
        <li>Find the two points — one per building — with the clearest line of sight to each other (a window facing a window, a rooftop, a courtyard).</li>
        <li>Measure roughly how many hops you need: assume 20–30 m of reliable range per hop through open air.</li>
        <li>Gather that many devices that can stay powered and awake — laptops or desktops, not phones.</li>
      </ul>

      <h2 id="setup">Setup</h2>
      <Steps>
        <li>Confirm each building&apos;s cluster works on its own first (<Link href="/tutorials/room-mesh">room mesh</Link>).</li>
        <li>Place one relay device at each chosen point, plus any intermediate relays needed to keep every consecutive pair in range.</li>
        <li>Enable relay on all of them and keep their screens on / sleep disabled.</li>
        <li>On each bridge device, open the peers view and confirm it sees its neighbours on both sides.</li>
      </Steps>

      <h2 id="verify">Verify and harden</h2>
      <p>
        Send a message from a device in building A to one in building B. It should traverse the whole
        chain and reach &ldquo;delivered&rdquo;. If it stalls, walk the chain and find the pair that
        is not connected in the peers view — that gap is where an extra relay goes.
      </p>
      <ul>
        <li>Add a redundant relay beside any single hop the whole bridge depends on.</li>
        <li>Put the bridge devices on power and, if possible, somewhere they will not be moved.</li>
        <li>Re-check the peers view periodically — a bridge is only as good as its weakest link staying up.</li>
      </ul>
    </DocLayout>
  );
}
