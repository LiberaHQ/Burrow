import Link from "next/link";
import { DocLayout, SectionCards } from "@/components/docs/DocLayout";

export const metadata = { title: "Tutorials" };

const toc = [{ id: "browse-tutorials", title: "Browse tutorials" }] as const;

export default function Page() {
  return (
    <DocLayout section="tutorials" href="/tutorials" title="Tutorials" toc={toc}>
      <p>
        Welcome to the Burrow tutorial portal. These are start-to-finish walkthroughs that build on
        each other — from getting two devices talking, to standing up a mesh that covers a whole
        building.
      </p>
      <p>
        The tutorials are an active work in progress. In the meantime, the{" "}
        <Link href="/docs">technical docs</Link> cover the same ground as reference material, and the{" "}
        <Link href="/#download">download page</Link> has the builds you will need.
      </p>

      <h2 id="browse-tutorials">Browse tutorials</h2>
      <SectionCards section="tutorials" />
    </DocLayout>
  );
}
