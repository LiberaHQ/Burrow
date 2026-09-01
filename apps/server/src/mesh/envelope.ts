import nacl from "tweetnacl";
import type { Identity } from "./identity.js";

const PROTOCOL_VERSION = 1;
const DEFAULT_TTL = 8;

export interface HelloEnvelope {
  v: 1;
  type: "hello";
  from: string;
  publicKey: string; // base64
}

export interface MsgEnvelope {
  v: 1;
  type: "msg";
  from: string;
  to: string;
  id: string;
  ttl: number;
  nonce: string; // base64
  ciphertext: string; // base64
}

export type Envelope = HelloEnvelope | MsgEnvelope;

export function encodeHello(identity: Identity): string {
  const envelope: HelloEnvelope = {
    v: PROTOCOL_VERSION,
    type: "hello",
    from: identity.hash,
    publicKey: Buffer.from(identity.publicKey).toString("base64"),
  };
  return JSON.stringify(envelope);
}

export function encodeMsg(params: {
  from: Identity;
  toHash: string;
  toPublicKey: Uint8Array;
  text: string;
  id?: string;
  ttl?: number;
}): string {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const ciphertext = nacl.box(Buffer.from(params.text, "utf8"), nonce, params.toPublicKey, params.from.secretKey);
  const envelope: MsgEnvelope = {
    v: PROTOCOL_VERSION,
    type: "msg",
    from: params.from.hash,
    to: params.toHash,
    id: params.id ?? Buffer.from(nacl.randomBytes(8)).toString("hex"),
    ttl: params.ttl ?? DEFAULT_TTL,
    nonce: Buffer.from(nonce).toString("base64"),
    ciphertext: Buffer.from(ciphertext).toString("base64"),
  };
  return JSON.stringify(envelope);
}

/** Returns null for anything that isn't a well-formed envelope (never throws on untrusted input). */
export function decodeEnvelope(raw: string): Envelope | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const obj = parsed as Record<string, unknown>;
  if (obj.v !== PROTOCOL_VERSION) return null;

  if (obj.type === "hello" && typeof obj.from === "string" && typeof obj.publicKey === "string") {
    return obj as unknown as HelloEnvelope;
  }
  if (
    obj.type === "msg" &&
    typeof obj.from === "string" &&
    typeof obj.to === "string" &&
    typeof obj.id === "string" &&
    typeof obj.ttl === "number" &&
    typeof obj.nonce === "string" &&
    typeof obj.ciphertext === "string"
  ) {
    return obj as unknown as MsgEnvelope;
  }
  return null;
}

/** Returns null if decryption/authentication fails (wrong key, tampered ciphertext, etc). */
export function decryptMsg(envelope: MsgEnvelope, me: Identity, senderPublicKey: Uint8Array): string | null {
  const nonce = new Uint8Array(Buffer.from(envelope.nonce, "base64"));
  const ciphertext = new Uint8Array(Buffer.from(envelope.ciphertext, "base64"));
  const plaintext = nacl.box.open(ciphertext, nonce, senderPublicKey, me.secretKey);
  if (!plaintext) return null;
  return Buffer.from(plaintext).toString("utf8");
}

export function decodePublicKey(base64: string): Uint8Array {
  return new Uint8Array(Buffer.from(base64, "base64"));
}

export function newMessageId(): string {
  return Buffer.from(nacl.randomBytes(8)).toString("hex");
}
