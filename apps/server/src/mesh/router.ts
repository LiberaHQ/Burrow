import { EventEmitter } from "node:events";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  decodeEnvelope,
  decodePublicKey,
  decryptMsg,
  encodeHello,
  encodeMsg,
  newMessageId,
  type MsgEnvelope,
} from "./envelope.js";
import type { Identity } from "./identity.js";

const DEFAULT_OUTBOX_PATH = path.join(os.homedir(), ".burrow", "outbox.json");
const SEEN_MESSAGE_TTL_MS = 5 * 60 * 1000;
const SEEN_MESSAGE_MAX = 2000;

export interface KnownIdentity {
  hash: string;
  publicKey: Uint8Array;
  lastSeen: number;
}

interface PendingMessage {
  id: string;
  text: string;
  queuedAt: number;
}

export type MeshEvent =
  | { type: "identityConnected"; identityHash: string; peerId: string }
  | { type: "identityDisconnected"; identityHash: string; peerId: string }
  | { type: "message"; fromIdentityHash: string; text: string; timestamp: number; delivered: boolean }
  | { type: "messageQueued"; toIdentityHash: string; text: string; timestamp: number };

/**
 * Sits between the raw BLE transport (which just moves opaque delimited
 * strings between connected peers) and the chat UI. Handles the identity
 * handshake, end-to-end encryption, store-and-forward queuing for peers
 * who aren't directly reachable right now, and flood-relay of messages
 * addressed to someone else entirely (simple multi-hop mesh delivery).
 */
export class MeshRouter extends EventEmitter {
  private knownIdentities = new Map<string, KnownIdentity>();
  private outbox = new Map<string, PendingMessage[]>();
  private seenMessageIds = new Map<string, number>();
  /** identityHash -> the BLE peerId we currently have a live, handshaken connection to. */
  private connectedIdentities = new Map<string, string>();

  private outboxPath: string;

  constructor(
    private identity: Identity,
    private sendRaw: (peerId: string, text: string) => Promise<void>,
    outboxPath: string = DEFAULT_OUTBOX_PATH,
  ) {
    super();
    this.outboxPath = outboxPath;
    this.loadOutbox();
  }

  getKnownIdentity(hash: string): KnownIdentity | undefined {
    return this.knownIdentities.get(hash);
  }

  isDirectlyConnected(identityHash: string): boolean {
    return this.connectedIdentities.has(identityHash);
  }

  /** Call right after a BLE connection is established, before any chat messages. */
  async initiateHandshake(peerId: string): Promise<void> {
    await this.sendRaw(peerId, encodeHello(this.identity));
  }

  /** Call with every raw string received over a BLE connection from peerId. */
  async handleIncoming(peerId: string, raw: string): Promise<void> {
    const envelope = decodeEnvelope(raw);
    if (!envelope) return;

    if (envelope.type === "hello") {
      const publicKey = decodePublicKey(envelope.publicKey);
      const isNewHandshake = !this.connectedIdentities.has(envelope.from);
      this.knownIdentities.set(envelope.from, { hash: envelope.from, publicKey, lastSeen: Date.now() });
      this.connectedIdentities.set(envelope.from, peerId);
      if (isNewHandshake) {
        this.emit("event", { type: "identityConnected", identityHash: envelope.from, peerId } satisfies MeshEvent);
        // Reply so the other side completes its own handshake if they connected to us
        // (peripheral role) rather than us to them.
        await this.sendRaw(peerId, encodeHello(this.identity));
      }
      await this.flushOutbox(envelope.from);
      return;
    }

    this.rememberSeen(envelope.id);

    if (envelope.to === this.identity.hash) {
      const sender = this.knownIdentities.get(envelope.from);
      if (!sender) return; // no handshake on record — can't have a valid key for them
      const text = decryptMsg(envelope, this.identity, sender.publicKey);
      if (text === null) return; // authentication failed; drop silently rather than show garbage
      this.emit("event", {
        type: "message",
        fromIdentityHash: envelope.from,
        text,
        timestamp: Date.now(),
        delivered: true,
      } satisfies MeshEvent);
      return;
    }

    await this.relay(envelope, peerId);
  }

  /** Call when a BLE connection drops. */
  handleDisconnect(peerId: string): void {
    for (const [hash, pid] of this.connectedIdentities) {
      if (pid === peerId) {
        this.connectedIdentities.delete(hash);
        this.emit("event", { type: "identityDisconnected", identityHash: hash, peerId } satisfies MeshEvent);
      }
    }
  }

  /**
   * Sends to a known identity. Delivers immediately if directly connected;
   * otherwise queues for later delivery and, if we know their public key
   * (from a past handshake) and have any other live connections, also
   * broadcasts it now in case one of those peers can relay it onward.
   */
  async sendToIdentity(toHash: string, text: string): Promise<{ delivered: boolean }> {
    const known = this.knownIdentities.get(toHash);
    const id = newMessageId();
    const directPeerId = this.connectedIdentities.get(toHash);

    if (known && directPeerId) {
      const raw = encodeMsg({ from: this.identity, toHash, toPublicKey: known.publicKey, text, id });
      await this.sendRaw(directPeerId, raw);
      return { delivered: true };
    }

    this.queue(toHash, { id, text, queuedAt: Date.now() });
    this.emit("event", {
      type: "messageQueued",
      toIdentityHash: toHash,
      text,
      timestamp: Date.now(),
    } satisfies MeshEvent);

    if (known) {
      const raw = encodeMsg({ from: this.identity, toHash, toPublicKey: known.publicKey, text, id });
      for (const peerId of this.connectedIdentities.values()) {
        await this.sendRaw(peerId, raw).catch(() => undefined);
      }
    }
    return { delivered: false };
  }

  private async relay(envelope: MsgEnvelope, fromPeerId: string): Promise<void> {
    if (envelope.ttl <= 0) return;
    const relayed: MsgEnvelope = { ...envelope, ttl: envelope.ttl - 1 };
    const raw = JSON.stringify(relayed);
    for (const [, peerId] of this.connectedIdentities) {
      if (peerId === fromPeerId) continue;
      await this.sendRaw(peerId, raw).catch(() => undefined);
    }
  }

  private async flushOutbox(identityHash: string): Promise<void> {
    const pending = this.outbox.get(identityHash);
    if (!pending || pending.length === 0) return;

    const known = this.knownIdentities.get(identityHash);
    const peerId = this.connectedIdentities.get(identityHash);
    if (!known || !peerId) return;

    this.outbox.delete(identityHash);
    this.saveOutbox();
    for (const msg of pending) {
      const raw = encodeMsg({ from: this.identity, toHash: identityHash, toPublicKey: known.publicKey, text: msg.text, id: msg.id });
      await this.sendRaw(peerId, raw).catch(() => undefined);
    }
  }

  private queue(identityHash: string, message: PendingMessage): void {
    const list = this.outbox.get(identityHash) ?? [];
    list.push(message);
    this.outbox.set(identityHash, list);
    this.saveOutbox();
  }

  private rememberSeen(id: string): void {
    const now = Date.now();
    this.seenMessageIds.set(id, now + SEEN_MESSAGE_TTL_MS);
    if (this.seenMessageIds.size > SEEN_MESSAGE_MAX) {
      for (const [seenId, expiry] of this.seenMessageIds) {
        if (expiry < now) this.seenMessageIds.delete(seenId);
      }
    }
  }

  private loadOutbox(): void {
    if (!fs.existsSync(this.outboxPath)) return;
    try {
      const raw = JSON.parse(fs.readFileSync(this.outboxPath, "utf8")) as Record<string, PendingMessage[]>;
      for (const [hash, messages] of Object.entries(raw)) {
        this.outbox.set(hash, messages);
      }
    } catch {
      // corrupt/unreadable outbox file — start fresh rather than crash startup
    }
  }

  private saveOutbox(): void {
    const dir = path.dirname(this.outboxPath);
    fs.mkdirSync(dir, { recursive: true });
    const obj = Object.fromEntries(this.outbox);
    fs.writeFileSync(this.outboxPath, JSON.stringify(obj));
  }
}
