import Link from "next/link";
import { DocLayout, Callout } from "@/components/docs/DocLayout";

export const metadata = { title: "Encryption" };

const toc = [
  { id: "identities", title: "Identities are keys" },
  { id: "end-to-end", title: "End-to-end by default" },
  { id: "what-is-visible", title: "What is still visible" },
  { id: "not-anonymity", title: "Encryption is not anonymity" },
] as const;

export default function Page() {
  return (
    <DocLayout section="docs" href="/docs/concepts/encryption" title="Encryption" toc={toc}>
      <h2 id="identities">Identities are keys</h2>
      <p>
        Your identity is a cryptographic keypair generated on your device. The public half is how
        people address you; the private half never leaves the device and is what decrypts messages
        sent to you. There is no account and no server-side record of it.
      </p>

      <h2 id="end-to-end">End-to-end by default</h2>
      <p>
        Every direct message is encrypted to the recipient&apos;s public key before it leaves your
        device and is only decrypted on theirs. Relaying devices in between forward ciphertext they
        cannot read. This is not a mode you switch on — there is no unencrypted path.
      </p>

      <h2 id="what-is-visible">What is still visible</h2>
      <p>Encryption protects message contents. It does not, on its own, hide:</p>
      <ul>
        <li>That your device is present and participating in the mesh.</li>
        <li>Routing information a relay needs to move a message toward its destination.</li>
        <li>Traffic patterns — timing and volume — to someone observing Bluetooth nearby.</li>
      </ul>
      <Callout type="warning">
        If hiding <em>that</em> you are communicating, or with whom, is part of your threat model,
        Burrow alone does not provide that. Treat it as private messaging, not anonymous messaging.
      </Callout>

      <h2 id="not-anonymity">Encryption is not anonymity</h2>
      <p>
        The two are different properties. Burrow gives you confidentiality of contents and
        authenticity of the sender. Anonymity — unlinkability of you to your messages — is a separate
        problem it does not try to solve today. See the notes in{" "}
        <Link href="/docs/reference">Reference</Link> for current thinking.
      </p>
    </DocLayout>
  );
}
