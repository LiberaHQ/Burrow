import Link from "next/link";
import { DocLayout, SectionCards, Callout } from "@/components/docs/DocLayout";

export const metadata = { title: "What is Burrow?" };

const toc = [
  { id: "explore-the-docs", title: "Explore the docs" },
  { id: "whats-in-the-box", title: "What's in the box" },
  { id: "built-on-bluetooth-le", title: "Built on Bluetooth LE" },
  { id: "who-its-for", title: "Who it's for" },
  { id: "what-it-is-not", title: "What it is not" },
  { id: "where-to-next", title: "Where to next" },
] as const;

export default function Page() {
  return (
    <DocLayout section="docs" href="/docs" title="What is Burrow?" toc={toc}>
      <p>
        Burrow is an encrypted chat mesh that runs entirely over{" "}
        <strong>Bluetooth LE</strong> — no accounts, no servers, and no internet connection. You can
        message someone across the room, across a building, or across a crowd, and the message hops
        peer to peer through nearby devices until it reaches whoever it is addressed to.
      </p>
      <p>
        There is no phone number to give out and no company sitting in the middle of the conversation.
        Your identity is a cryptographic keypair that lives on your device, and every message is
        end-to-end encrypted before it leaves it.
      </p>
      <p>
        Have questions? The <Link href="/docs/reference">reference section</Link> collects the honest
        answers about current state versus what is still planned.
      </p>

      <h2 id="explore-the-docs">Explore the docs</h2>
      <p>Each area below is a short set of guides you can read in order or dip into as needed.</p>
      <SectionCards section="docs" />

      <h2 id="whats-in-the-box">What&apos;s in the box</h2>
      <p>
        The short version: Burrow is a single app with builds for macOS, Linux, and Android. Every
        build carries the same two halves of the Bluetooth stack — a <strong>central</strong> role
        that scans for and connects to nearby peers, and a <strong>peripheral</strong> role that
        advertises this device so others can find it. A device does both at once, which is what makes
        the mesh work without any fixed infrastructure.
      </p>
      <p>
        On top of that sits the message layer: conversations keyed to identities, delivery and relay
        state for each message, and store-and-forward so a message waits on an intermediate device
        until the next hop comes back into range.
      </p>

      <h2 id="built-on-bluetooth-le">Built on Bluetooth LE</h2>
      <p>
        Bluetooth LE is the network. It is on every recent phone and laptop, it works with no pairing
        dialog and no setup, and it does not touch the internet, DNS, or your carrier. The trade-off
        is range — tens of metres in the open, less through walls — which is exactly why Burrow
        relays: a message that cannot reach its destination directly rides along through whatever
        devices are in between.
      </p>
      <p>
        You do not need to understand any of that to send a message. But it is why Burrow keeps
        working when the Wi-Fi is down, the cell network is saturated, or a particular service is
        blocked.
      </p>

      <h2 id="who-its-for">Who it&apos;s for</h2>
      <ul>
        <li>
          People who want private messaging without trusting a company, providing a phone number, or
          being reachable through a username someone else issues.
        </li>
        <li>
          Crowds, venues, and campuses where the mobile network falls over but everyone still has a
          phone in their pocket.
        </li>
        <li>
          Groups on trips, at events, or in buildings where a small local mesh is all the coverage
          anyone needs.
        </li>
        <li>
          Tinkerers and developers who want to build on a real peer-to-peer transport with a clean
          implementation and a friendly UI.
        </li>
      </ul>

      <h2 id="what-it-is-not">What it is not</h2>
      <ul>
        <li>
          <strong>Not the regular internet.</strong> Burrow does not use the web and does not need
          DNS or an ISP-routed connection. It runs over its own Bluetooth mesh.
        </li>
        <li>
          <strong>Not a Discord or WhatsApp replacement.</strong> There are no servers and no rooms
          you join with a link. Conversations are between identities, end-to-end.
        </li>
        <li>
          <strong>Not long-range.</strong> The mesh reaches as far as there are participating devices
          to carry it. It is built for a room, a building, or a crowd — not a city.
        </li>
        <li>
          <strong>Not finished.</strong> This is an active project. Things land and things change;
          the reference section is the most current read on what works today.
        </li>
      </ul>

      <Callout type="note">
        Encryption hides the contents of your messages. On its own it does not hide that you are on
        the mesh or who you are talking to — see <Link href="/docs/concepts/encryption">Encryption</Link>{" "}
        for what is and is not protected.
      </Callout>

      <h2 id="where-to-next">Where to next</h2>
      <ul>
        <li>
          New here — start with <Link href="/docs/getting-started/install">Install</Link>, then{" "}
          <Link href="/docs/getting-started/first-session">Your first session</Link>.
        </li>
        <li>
          Curious how it works — read <Link href="/docs/concepts/mesh">How the mesh works</Link> and{" "}
          <Link href="/docs/concepts/encryption">Encryption</Link>.
        </li>
        <li>
          Want step-by-step walkthroughs — head to the{" "}
          <Link href="/tutorials">tutorials</Link>.
        </li>
      </ul>
    </DocLayout>
  );
}
