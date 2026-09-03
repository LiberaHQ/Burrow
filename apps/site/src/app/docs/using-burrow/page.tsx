import { DocLayout, SectionCards } from "@/components/docs/DocLayout";

export const metadata = { title: "Using Burrow" };

const toc = [{ id: "in-this-section", title: "In this section" }] as const;

export default function Page() {
  return (
    <DocLayout section="docs" href="/docs/using-burrow" title="Using Burrow" toc={toc}>
      <p>
        Day-to-day reference for the app once it is installed and paired — how conversations behave,
        how peers are named and remembered, and what every setting does.
      </p>

      <h2 id="in-this-section">In this section</h2>
      <SectionCards section="docs" group="/docs/using-burrow" />
    </DocLayout>
  );
}
