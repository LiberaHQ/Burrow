import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Docs",
    template: "%s | Burrow Docs",
  },
  description:
    "Guides for installing and running Burrow, how the Bluetooth LE mesh works, and reference material.",
};

export default function DocsLayout({ children }: LayoutProps<"/docs">) {
  return children;
}
