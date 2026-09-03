import Link from "next/link";
import { DocLayout, Callout } from "@/components/docs/DocLayout";

export const metadata = { title: "Reference" };

const toc = [
  { id: "building-from-source", title: "Building from source" },
  { id: "storage-layout", title: "Storage layout" },
  { id: "troubleshooting", title: "Troubleshooting" },
  { id: "project-status", title: "Project status" },
] as const;

export default function Page() {
  return (
    <DocLayout section="docs" href="/docs/reference" title="Reference" toc={toc}>
      <h2 id="building-from-source">Building from source</h2>
      <p>
        The repository is a pnpm workspace. The desktop app builds with the platform scripts under{" "}
        <code>apps/desktop/</code>; Linux specifically must compile its Bluetooth layer locally, which
        the <code>linux-build</code> script handles. The{" "}
        <Link href="/docs/getting-started/install">Install page</Link> has the step-by-step Linux
        build.
      </p>

      <h2 id="storage-layout">Storage layout</h2>
      <ul>
        <li>Identity keypair — in the app&apos;s per-user data directory, never transmitted.</li>
        <li>Conversations and contacts — a local database alongside it.</li>
        <li>Exported archives — encrypted, written wherever you choose on export.</li>
      </ul>

      <h2 id="troubleshooting">Troubleshooting</h2>
      <ul>
        <li><strong>Stuck on &ldquo;scanning&rdquo;</strong> — OS-level Bluetooth permission; re-check <Link href="/docs/networking">Networking</Link>.</li>
        <li><strong>Peer visible but messages stay &ldquo;sent&rdquo;</strong> — usually a relay carrying it is out of range of the recipient; wait, or shorten the path.</li>
        <li><strong>App won&apos;t open on macOS</strong> — right-click &rarr; Open the first time (<Link href="/docs/getting-started/install">Install</Link>).</li>
      </ul>

      <h2 id="project-status">Project status</h2>
      <Callout type="note">
        Burrow is pre-1.0 and under active development. Message formats, storage, and platform
        support can still change between releases. This page is the most current honest summary of
        what works today.
      </Callout>
    </DocLayout>
  );
}
