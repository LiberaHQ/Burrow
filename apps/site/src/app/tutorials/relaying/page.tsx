import Link from "next/link";
import { DocLayout, Callout, Steps } from "@/components/docs/DocLayout";

export const metadata = { title: "Relaying across floors" };

const toc = [
  { id: "goal", title: "Goal" },
  { id: "the-idea", title: "The idea" },
  { id: "setup", title: "Setup" },
  { id: "test", title: "Test the relay" },
  { id: "tuning", title: "Tuning" },
] as const;

export default function Page() {
  return (
    <DocLayout
      section="tutorials"
      href="/tutorials/relaying"
      title="Relaying across floors"
      toc={toc}
    >
      <h2 id="goal">Goal</h2>
      <p>
        Connect two devices that are out of direct Bluetooth range by placing a third device between
        them to carry traffic.
      </p>

      <h2 id="the-idea">The idea</h2>
      <p>
        A message that cannot reach its destination directly is handed to a device that can — which
        passes it on toward the recipient. The relay never reads the contents; it only moves
        ciphertext. Full background is in{" "}
        <Link href="/docs/concepts/mesh">How the mesh works</Link>.
      </p>

      <h2 id="setup">Setup</h2>
      <Steps>
        <li>Put device A on one floor and device C on the floor above or below, far enough apart that they do not see each other in the peers view.</li>
        <li>Place device B near the stairwell or an open span between them — ideally somewhere with a clearer vertical path.</li>
        <li>Make sure B has relay enabled and its screen on (a plugged-in laptop is ideal here).</li>
      </Steps>
      <Callout type="warning">
        If B is a phone that locks or backgrounds Burrow, the relay will stall. For anything you want
        to rely on, use a device that stays awake.
      </Callout>

      <h2 id="test">Test the relay</h2>
      <p>
        From A, send a message to C. It should show &ldquo;sent&rdquo; quickly (A handed it to B) and
        then &ldquo;delivered&rdquo; once B reaches C. Watch B&apos;s peers view — you should see it
        connected to both A and C.
      </p>

      <h2 id="tuning">Tuning</h2>
      <ul>
        <li>Move B a metre at a time toward wherever the link is weakest; small changes in position matter more than distance.</li>
        <li>Add a second relay device if one is not enough — the mesh will use whichever path works.</li>
        <li>Two buildings instead of two floors is the next step: <Link href="/tutorials/bridging">Bridging two buildings</Link>.</li>
      </ul>
    </DocLayout>
  );
}
