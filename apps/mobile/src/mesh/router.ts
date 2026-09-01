import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  decodeEnvelope,
  decodePublicKey,
  decryptMsg,
  encodeHello,
  encodeMsg,
  newMessageId,
  type MsgEnvelope,
} from "./envelope";
import type { Identity } from "./identity";
import { TinyEmitter } from "./tinyEmitter";

const OUTBOX_STORAGE_KEY = "burrow.outbox";
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
 * Same design as apps/server/src/mesh/router.ts (see its comments for the
 * full rationale) — sits between the raw BLE transport and the chat UI,
 * handling the identity handshake, end-to-end encryption, store-and-forward
 * queuing, and flood-relay of messages addressed to someone else entirely.
 * Ported here (not shared as a package) because apps/mobile deliberately
 * isn't a pnpm workspace member — see its README.
 */
export class MeshRouter {
  private knownIdentities = new Map<string, KnownIdentity>();
  private outbox = new Map<string, PendingMessage[]>();
  private seenMessageIds = new Map<string, number>();
  private connectedIdentities = new Map<string, string>();
  private emitter = new TinyEmitter<MeshEvent>();
  readonly ready: Promise<void>;

  constructor(
    private identity: Identity,
    private sendRaw: (peerId: string, text: string) => Promise<void>,
  ) {
    this.ready = this.loadOutbox();
  }

  on(listener: (event: MeshEvent) => void): () => void {
    return this.emitter.on(listener);
  }

  getKnownIdentity(hash: string): KnownIdentity | undefined {
    return this.knownIdentities.get(hash);
  }

  isDirectlyConnected(identityHash: string): boolean {
    return this.connectedIdentities.has(identityHash);
  }

  async initiateHandshake(peerId: string): Promise<void> {
    await this.sendRaw(peerId, encodeHello(this.identity));
  }

  async handleIncoming(peerId: string, raw: string): Promise<void> {
    const envelope = decodeEnvelope(raw);
    if (!envelope) return;

    if (envelope.type === "hello") {
      const publicKey = decodePublicKey(envelope.publicKey);
      const isNewHandshake = !this.connectedIdentities.has(envelope.from);
      this.knownIdentities.set(envelope.from, { hash: envelope.from, publicKey, lastSeen: Date.now() });
      this.connectedIdentities.set(envelope.from, peerId);
      if (isNewHandshake) {
        this.emitter.emit({ type: "identityConnected", identityHash: envelope.from, peerId } satisfies MeshEvent);
        await this.sendRaw(peerId, encodeHello(this.identity));
      }
      await this.flushOutbox(envelope.from);
      return;
    }

    this.rememberSeen(envelope.id);

    if (envelope.to === this.identity.hash) {
      const sender = this.knownIdentities.get(envelope.from);
      if (!sender) return;
      const text = decryptMsg(envelope, this.identity, sender.publicKey);
      if (text === null) return;
      this.emitter.emit({
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

  handleDisconnect(peerId: string): void {
    for (const [hash, pid] of this.connectedIdentities) {
      if (pid === peerId) {
        this.connectedIdentities.delete(hash);
        this.emitter.emit({ type: "identityDisconnected", identityHash: hash, peerId } satisfies MeshEvent);
      }
    }
  }

  async sendToIdentity(toHash: string, text: string): Promise<{ delivered: boolean }> {
    const known = this.knownIdentities.get(toHash);
    const id = newMessageId();
    const directPeerId = this.connectedIdentities.get(toHash);

    if (known && directPeerId) {
      const raw = encodeMsg({ from: this.identity, toHash, toPublicKey: known.publicKey, text, id });
      await this.sendRaw(directPeerId, raw);
      return { delivered: true };
    }

    await this.queue(toHash, { id, text, queuedAt: Date.now() });
    this.emitter.emit({
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
    await this.saveOutbox();
    for (const msg of pending) {
      const raw = encodeMsg({ from: this.identity, toHash: identityHash, toPublicKey: known.publicKey, text: msg.text, id: msg.id });
      await this.sendRaw(peerId, raw).catch(() => undefined);
    }
  }

  private async queue(identityHash: string, message: PendingMessage): Promise<void> {
    const list = this.outbox.get(identityHash) ?? [];
    list.push(message);
    this.outbox.set(identityHash, list);
    await this.saveOutbox();
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

  private async loadOutbox(): Promise<void> {
    const raw = await AsyncStorage.getItem(OUTBOX_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Record<string, PendingMessage[]>;
      for (const [hash, messages] of Object.entries(parsed)) {
        this.outbox.set(hash, messages);
      }
    } catch {
      // corrupt/unreadable outbox — start fresh rather than crash startup
    }
  }

  private async saveOutbox(): Promise<void> {
    const obj = Object.fromEntries(this.outbox);
    await AsyncStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(obj));
  }
}
