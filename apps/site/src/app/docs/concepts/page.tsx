import { DocLayout, SectionCards } from "@/components/docs/DocLayout";

export const metadata = { title: "Concepts" };

const toc = [{ id: "in-this-section", title: "In this section" }] as const;

export default function Page() {
  return (
    <DocLayout section="docs" href="/docs/concepts" title="Concepts" toc={toc}>
      <p>
        You do not need any of this to use Burrow. It is here for when you want to know why the app
        behaves the way it does — why messages sometimes take a scenic route, and what encryption
        does and does not cover.
      </p>

      <h2 id="in-this-section">In this section</h2>
      <SectionCards section="docs" group="/docs/concepts" />
    </DocLayout>
  );
}
