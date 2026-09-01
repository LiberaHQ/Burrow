import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import nacl from "tweetnacl";

export interface Identity {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
  /** Short display/routing id derived from the public key — analogous to a Reticulum destination hash. */
  hash: string;
}

// Overridable so a second local instance (e.g. for testing two desktop
// clients talking to each other on one machine) can use its own identity
// instead of colliding with the default one.
const IDENTITY_DIR = process.env.BURROW_HOME ?? path.join(os.homedir(), ".burrow");
const IDENTITY_PATH = path.join(IDENTITY_DIR, "identity.json");

/** First 8 bytes of SHA-512(publicKey), hex-encoded — a short, stable id for a peer's identity. */
export function identityHashOf(publicKey: Uint8Array): string {
  const digest = nacl.hash(publicKey);
  return Buffer.from(digest.subarray(0, 8)).toString("hex");
}

let cached: Identity | null = null;

/** Loads the persisted device identity, generating and persisting a new one on first run. */
export function loadOrCreateIdentity(): Identity {
  if (cached) return cached;

  if (fs.existsSync(IDENTITY_PATH)) {
    const raw = JSON.parse(fs.readFileSync(IDENTITY_PATH, "utf8")) as { publicKey: string; secretKey: string };
    const publicKey = new Uint8Array(Buffer.from(raw.publicKey, "base64"));
    const secretKey = new Uint8Array(Buffer.from(raw.secretKey, "base64"));
    cached = { publicKey, secretKey, hash: identityHashOf(publicKey) };
    return cached;
  }

  const keyPair = nacl.box.keyPair();
  fs.mkdirSync(IDENTITY_DIR, { recursive: true });
  fs.writeFileSync(
    IDENTITY_PATH,
    JSON.stringify({
      publicKey: Buffer.from(keyPair.publicKey).toString("base64"),
      secretKey: Buffer.from(keyPair.secretKey).toString("base64"),
    }),
    { mode: 0o600 },
  );
  cached = { publicKey: keyPair.publicKey, secretKey: keyPair.secretKey, hash: identityHashOf(keyPair.publicKey) };
  return cached;
}
