import Link from "next/link";
import { DocLayout, SectionCards } from "@/components/docs/DocLayout";

export const metadata = { title: "Getting Started" };

const toc = [
  { id: "before-you-start", title: "Before you start" },
  { id: "the-path", title: "The path" },
] as const;

export default function Page() {
  return (
    <DocLayout section="docs" href="/docs/getting-started" title="Getting Started" toc={toc}>
      <p>
        This section takes you from nothing installed to a working conversation with a nearby device.
        It should take about ten minutes, most of which is the first-launch security prompt on
        whichever platform you are using.
      </p>

      <h2 id="before-you-start">Before you start</h2>
      <ul>
        <li>A second device running Burrow, within Bluetooth range (same room is ideal for the first run).</li>
        <li>Bluetooth switched on, and permission to use it granted to the app.</li>
        <li>No network of any kind is required — you can do this in airplane mode.</li>
      </ul>

      <h2 id="the-path">The path</h2>
      <p>Work through these in order:</p>
      <SectionCards section="docs" group="/docs/getting-started" />
      <p>
        When both pages are done, the <Link href="/tutorials">tutorials</Link> pick up with larger
        setups — room meshes, relaying between floors, and bridging separate clusters.
      </p>
    </DocLayout>
  );
}
