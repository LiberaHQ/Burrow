import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Tutorials",
    template: "%s | Burrow Tutorials",
  },
  description:
    "Step-by-step guides for Burrow — from pairing two devices to bridging separate Bluetooth clusters into one mesh.",
};

export default function TutorialsLayout({ children }: LayoutProps<"/tutorials">) {
  return children;
}
