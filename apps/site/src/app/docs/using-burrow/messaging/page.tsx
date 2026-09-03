import Link from "next/link";
import { DocLayout, Callout } from "@/components/docs/DocLayout";

export const metadata = { title: "Messaging & peers" };

const toc = [
  { id: "peers", title: "How peers are identified" },
  { id: "conversations", title: "Conversations" },
  { id: "delivery-states", title: "Delivery states" },
  { id: "groups", title: "Groups" },
] as const;

export default function Page() {
  return (
    <DocLayout
      section="docs"
      href="/docs/using-burrow/messaging"
      title="Messaging & peers"
      toc={toc}
    >
      <p>
        Everything in Burrow is addressed to an <strong>identity</strong> — a public key your contact
        controls — not to a username, handle, or number.
      </p>

      <h2 id="peers">How peers are identified</h2>
      <p>
        Each identity has a short fingerprint derived from its public key. Display names are cosmetic
        and can collide; the fingerprint is the thing to compare if you want to be sure who you are
        talking to. Once you have had a conversation with a peer, Burrow remembers the identity so it
        is recognised on later encounters even if the display name changed.
      </p>

      <h2 id="conversations">Conversations</h2>
      <p>
        A conversation is the running history with one identity, stored locally on your device. There
        is no server copy. If you remove the app or switch devices without exporting, that history is
        gone — see <Link href="/docs/using-burrow/settings">Settings</Link> for storage and export.
      </p>

      <h2 id="delivery-states">Delivery states</h2>
      <ul>
        <li><strong>Queued</strong> — written locally, waiting for a route to the recipient.</li>
        <li><strong>Sent</strong> — handed to at least one peer on the way.</li>
        <li><strong>Delivered</strong> — the recipient&apos;s device acknowledged it.</li>
      </ul>
      <Callout type="note">
        A message can sit at &ldquo;sent&rdquo; for a long time if it is being carried by an
        intermediate device that has not yet come back into range of the recipient. That is normal
        for a relayed mesh.
      </Callout>

      <h2 id="groups">Groups</h2>
      <p>
        Group chat is supported, but the model is different from a server-hosted room: a group is a
        shared key distributed to each member, and messages fan out to members as they become
        reachable. There is no membership list held anywhere central.
      </p>
    </DocLayout>
  );
}
