import Link from "next/link";
import { DocLayout, Callout, Steps } from "@/components/docs/DocLayout";

export const metadata = { title: "Building a room mesh" };

const toc = [
  { id: "goal", title: "Goal" },
  { id: "setup", title: "Setup" },
  { id: "verify", title: "Verify the mesh" },
  { id: "groups", title: "Add a group" },
] as const;

export default function Page() {
  return (
    <DocLayout section="tutorials" href="/tutorials/room-mesh" title="Building a room mesh" toc={toc}>
      <h2 id="goal">Goal</h2>
      <p>
        Take three to eight devices in one space and get them all reachable from each other, then run
        a group conversation across the whole set.
      </p>

      <h2 id="setup">Setup</h2>
      <Steps>
        <li>Install and launch Burrow on every device; set a display name on each.</li>
        <li>Confirm each device has relay enabled in <Link href="/docs/using-burrow/settings">Settings</Link> — on by default.</li>
        <li>Spread the devices around the room rather than stacking them in one spot.</li>
        <li>Open the peers view on each and let discovery settle for about a minute.</li>
      </Steps>
      <Callout type="tip">
        In a single room every device is usually in direct range of every other, so no relaying is
        needed yet. The point of this step is a clean baseline before you start stretching the
        distance in <Link href="/tutorials/relaying">Relaying across floors</Link>.
      </Callout>

      <h2 id="verify">Verify the mesh</h2>
      <p>
        From one device, send a direct message to each other device in turn. All should reach
        &ldquo;delivered&rdquo; quickly. If one lags, check that its screen is on and its Bluetooth
        permission is granted.
      </p>

      <h2 id="groups">Add a group</h2>
      <p>
        Create a group and add every participant. Send a message and confirm it lands on all devices.
        A group is a shared key plus fan-out delivery — there is no server holding the membership
        list, so everyone who should be in it needs to be added explicitly.
      </p>
    </DocLayout>
  );
}
