import { EventEmitter } from "node:events";
import noble, { type Characteristic, type Peripheral, type Service } from "@abandonware/noble";
import { loadOrCreateIdentity, type Identity } from "../mesh/identity.js";
import { MeshRouter, type MeshEvent } from "../mesh/router.js";
import { MacPeripheral, type PeripheralEvent } from "./peripheral.js";
import type { BleEvent, ChatMessage, Peer } from "./types.js";

/** Peer ids for incoming peripheral-role connections are namespaced so they
 * can't collide with noble's own (unprefixed) central-role peer ids. */
const PERIPHERAL_PREFIX = "peripheral:";

/**
 * Nordic UART Service (NUS) UUIDs. Chosen instead of a bespoke service
 * because a wide range of real BLE peripherals already implement it
 * (ESP32 examples, nRF Connect's "UART" simulator, many BLE-UART bridges),
 * so you can test peer discovery/chat against real hardware without
 * writing custom firmware first.
 */
const UART_SERVICE_UUID = "6e400001b5a3f393e0a9e50e24dcca9e";
const UART_RX_CHAR_UUID = "6e400002b5a3f393e0a9e50e24dcca9e"; // write: central -> peripheral
const UART_TX_CHAR_UUID = "6e400003b5a3f393e0a9e50e24dcca9e"; // notify: peripheral -> central

// Conservative default ATT MTU payload size; real MTU is negotiated per
// connection but noble doesn't expose it, so chunk defensively.
const WRITE_CHUNK_BYTES = 20;

// Messages are framed with a trailing newline so multi-chunk writes/notifies
// (anything over WRITE_CHUNK_BYTES, i.e. almost any real sentence) can be
// reassembled on the receiving side instead of arriving pre-fragmented.
const MESSAGE_DELIMITER = 0x0a; // '\n'

// Some peripherals never confirm or error out of a connection attempt at
// all; bound how long we'll wait so the UI is never stuck forever.
const CONNECT_TIMEOUT_MS = 8_000;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

interface Connection {
  peripheral: Peripheral;
  rx: Characteristic;
  tx: Characteristic;
  recvBuffer: Buffer;
}

/**
 * Wraps noble to expose the app's BLE central role: scan for nearby
 * peripherals, connect to ones that speak the UART chat service, and
 * exchange text messages over it.
 *
 * Every connection is layered with a mesh protocol (see ../mesh/): once the
 * raw BLE link is up, both sides exchange cryptographic identities, and all
 * chat messages afterward are end-to-end encrypted, addressed by identity
 * rather than by the (session-scoped, sometimes-rotating) BLE address, and
 * eligible for store-and-forward queuing / flood relay through other
 * connected peers if the intended recipient isn't directly reachable.
 *
 * Also implements the *peripheral* role on macOS (see ./peripheral.ts) —
 * advertising a GATT server other Burrow devices (desktop or mobile) can
 * discover and connect to, rather than only ever connecting out to them.
 * Not yet implemented on Linux — see README.
 */
class BleManager extends EventEmitter {
  private peripherals = new Map<string, Peripheral>();
  private connections = new Map<string, Connection>();
  private scanning = false;
  private router: MeshRouter;
  private identity: Identity;
  /** BLE peerId <-> identityHash, remembered even after disconnect so offline messaging/reconnect still resolves correctly. */
  private peerIdentities = new Map<string, string>();
  private identityToPeerId = new Map<string, string>();
  /** Peers that exist only because we received a relayed message from them, never a direct BLE connection. */
  private syntheticPeers = new Map<string, Peer>();
  /** Incoming peripheral-role connections (centrals that connected to us), keyed by the raw centralId (no prefix). */
  private incomingCentrals = new Map<string, Peer>();
  private peripheral = new MacPeripheral();

  constructor() {
    super();
    noble.on("stateChange", (state) => {
      if (state !== "poweredOn" && this.scanning) {
        this.scanning = false;
        this.emit("event", { type: "scanState", scanning: false } satisfies BleEvent);
      }
    });
    noble.on("discover", (peripheral) => this.handleDiscover(peripheral));
    this.peripheral.on("event", (event: PeripheralEvent) => this.handlePeripheralEvent(event));

    this.identity = loadOrCreateIdentity();
    this.router = new MeshRouter(this.identity, (peerId, text) => this.rawSend(peerId, text));
    this.router.on("event", (event: MeshEvent) => this.handleMeshEvent(event));
  }

  get isPeripheralSupported(): boolean {
    return this.peripheral.isSupported;
  }

  get advertising(): boolean {
    return this.peripheral.advertising;
  }

  async startAdvertising(name: string): Promise<void> {
    await this.peripheral.startAdvertising(name);
  }

  async stopAdvertising(): Promise<void> {
    await this.peripheral.stopAdvertising();
  }

  get ownIdentity(): { hash: string; publicKey: string } {
    return { hash: this.identity.hash, publicKey: Buffer.from(this.identity.publicKey).toString("base64") };
  }

  get adapterState(): string {
    return noble.state;
  }

  get isScanning(): boolean {
    return this.scanning;
  }

  async startScan(): Promise<void> {
    if (noble.state !== "poweredOn") {
      throw new Error(`Bluetooth adapter not ready (state: ${noble.state})`);
    }
    await noble.startScanningAsync([], true);
    this.scanning = true;
    this.emit("event", { type: "scanState", scanning: true } satisfies BleEvent);
  }

  async stopScan(): Promise<void> {
    await noble.stopScanningAsync();
    this.scanning = false;
    this.emit("event", { type: "scanState", scanning: false } satisfies BleEvent);
  }

  listPeers(): Peer[] {
    return [...this.peripherals.values()]
      .map((p) => this.toPeer(p))
      .concat([...this.syntheticPeers.values()], [...this.incomingCentrals.values()]);
  }

  async connect(peerId: string): Promise<void> {
    const peripheral = this.peripherals.get(peerId);
    if (!peripheral) throw new Error(`Unknown peer: ${peerId}`);

    // Some peripherals (flaky/uncooperative radios) never confirm or error
    // out of connectAsync() at all — calling disconnectAsync() on them mid-
    // attempt doesn't reliably unstick it either. Bound the wait so the UI
    // is never stuck forever with no way out; if the original attempt does
    // still resolve later, tear the stray connection back down since we've
    // already given up on it and told the caller it failed.
    const connectAttempt = peripheral.connectAsync();
    try {
      await withTimeout(connectAttempt, CONNECT_TIMEOUT_MS, "Connection attempt timed out");
    } catch (err) {
      connectAttempt.then(() => peripheral.disconnectAsync()).catch(() => undefined);
      throw err;
    }

    try {
      const services = await peripheral.discoverServicesAsync([UART_SERVICE_UUID]);
      let service: Service | undefined = services[0];
      if (!service) {
        const allServices = await peripheral.discoverServicesAsync();
        service = allServices.find((s) => s.uuid === UART_SERVICE_UUID);
        if (!service) {
          const found = allServices.map((s) => s.uuid).join(", ") || "(none)";
          throw new Error(
            `Peer does not expose the UART chat service (${UART_SERVICE_UUID}). Services it does expose: ${found}`,
          );
        }
      }

      const characteristics = await service.discoverCharacteristicsAsync([
        UART_RX_CHAR_UUID,
        UART_TX_CHAR_UUID,
      ]);
      let rx = characteristics.find((c) => c.uuid === UART_RX_CHAR_UUID);
      let tx = characteristics.find((c) => c.uuid === UART_TX_CHAR_UUID);
      if (!rx || !tx) {
        const allCharacteristics = await service.discoverCharacteristicsAsync();
        rx ??= allCharacteristics.find((c) => c.uuid === UART_RX_CHAR_UUID);
        tx ??= allCharacteristics.find((c) => c.uuid === UART_TX_CHAR_UUID);
        if (!rx || !tx) {
          const found = allCharacteristics.map((c) => c.uuid).join(", ") || "(none)";
          throw new Error(
            `Peer is missing the required chat characteristics (rx=${UART_RX_CHAR_UUID}, tx=${UART_TX_CHAR_UUID}). Found: ${found}`,
          );
        }
      }

      await tx.subscribeAsync();
      tx.on("data", (data: Buffer) => {
        const conn = this.connections.get(peerId);
        if (!conn) return;
        conn.recvBuffer = Buffer.concat([conn.recvBuffer, data]);
        for (const text of extractFramedMessages(conn)) {
          this.router.handleIncoming(peerId, text).catch((err) => {
            this.emit("event", { type: "error", message: (err as Error).message } satisfies BleEvent);
          });
        }
      });

      peripheral.on("disconnect", () => {
        this.connections.delete(peerId);
        this.router.handleDisconnect(peerId);
        this.emit("event", {
          type: "peerDisconnected",
          peer: this.toPeer(peripheral),
        } satisfies BleEvent);
      });

      this.connections.set(peerId, { peripheral, rx, tx, recvBuffer: Buffer.alloc(0) });
      this.emit("event", { type: "peerConnected", peer: this.toPeer(peripheral) } satisfies BleEvent);

      // Kick off the identity handshake; the peer becomes securely addressable
      // once the router reports identityConnected (see handleMeshEvent).
      await this.router.initiateHandshake(peerId);
    } catch (err) {
      await peripheral.disconnectAsync().catch(() => undefined);
      throw err;
    }
  }

  async disconnect(peerId: string): Promise<void> {
    const conn = this.connections.get(peerId);
    if (conn) {
      await conn.peripheral.disconnectAsync();
      this.connections.delete(peerId);
      return;
    }

    // No fully-established connection yet, but a connect() call may still be
    // in flight (stuck in connectAsync/service discovery, e.g. on a flaky
    // peripheral) — abort it at the radio level so the UI isn't stuck
    // forever with no way out. This causes that pending connect() to reject.
    const peripheral = this.peripherals.get(peerId);
    if (peripheral && (peripheral.state === "connecting" || peripheral.state === "connected")) {
      await peripheral.disconnectAsync().catch(() => undefined);
    }
  }

  async sendMessage(peerId: string, text: string): Promise<ChatMessage> {
    const identityHash = peerId.startsWith("identity:")
      ? peerId.slice("identity:".length)
      : this.peerIdentities.get(peerId);
    if (!identityHash) {
      throw new Error("Still establishing a secure connection with this peer — try again in a moment.");
    }

    const { delivered } = await this.router.sendToIdentity(identityHash, text);
    const message: ChatMessage = { peerId, direction: "out", text, timestamp: Date.now(), delivered };
    this.emit("event", { type: "message", message } satisfies BleEvent);
    return message;
  }

  private async rawSend(peerId: string, text: string): Promise<void> {
    if (peerId.startsWith(PERIPHERAL_PREFIX)) {
      this.peripheral.sendMessage(peerId.slice(PERIPHERAL_PREFIX.length), text);
      return;
    }

    const conn = this.connections.get(peerId);
    if (!conn) throw new Error(`Not connected to peer: ${peerId}`);

    const data = Buffer.concat([Buffer.from(text, "utf8"), Buffer.from([MESSAGE_DELIMITER])]);
    for (let offset = 0; offset < data.length; offset += WRITE_CHUNK_BYTES) {
      const chunk = data.subarray(offset, offset + WRITE_CHUNK_BYTES);
      await conn.rx.writeAsync(chunk, true);
    }
  }

  private handlePeripheralEvent(event: PeripheralEvent): void {
    switch (event.type) {
      case "advertising":
        this.emit("event", {
          type: "advertisingState",
          advertising: event.advertising,
          error: event.error,
        } satisfies BleEvent);
        break;
      case "subscribed": {
        const peerId = PERIPHERAL_PREFIX + event.centralId;
        const existing = this.incomingCentrals.get(peerId);
        const peer: Peer = {
          id: peerId,
          name: existing?.name ?? null,
          rssi: 0,
          connectable: true,
          connected: true,
          lastSeen: Date.now(),
          identityHash: existing?.identityHash ?? this.peerIdentities.get(peerId) ?? null,
          role: "peripheral",
        };
        this.incomingCentrals.set(peerId, peer);
        this.emit("event", { type: "peerConnected", peer } satisfies BleEvent);
        break;
      }
      case "unsubscribed": {
        const peerId = PERIPHERAL_PREFIX + event.centralId;
        const existing = this.incomingCentrals.get(peerId);
        if (!existing) break;
        const peer = { ...existing, connected: false };
        this.incomingCentrals.set(peerId, peer);
        this.router.handleDisconnect(peerId);
        this.emit("event", { type: "peerDisconnected", peer } satisfies BleEvent);
        break;
      }
      case "message": {
        const peerId = PERIPHERAL_PREFIX + event.centralId;
        this.router.handleIncoming(peerId, event.text).catch((err) => {
          this.emit("event", { type: "error", message: (err as Error).message } satisfies BleEvent);
        });
        break;
      }
      case "state":
        break; // adapter power state — central role's noble.state already covers this for the UI
    }
  }

  private handleMeshEvent(event: MeshEvent): void {
    switch (event.type) {
      case "identityConnected": {
        this.peerIdentities.set(event.peerId, event.identityHash);
        this.identityToPeerId.set(event.identityHash, event.peerId);
        this.syntheticPeers.delete(event.identityHash);

        if (event.peerId.startsWith(PERIPHERAL_PREFIX)) {
          const existing = this.incomingCentrals.get(event.peerId);
          if (existing) {
            // No BLE API exposes a connecting central's device name (see the
            // Peer.role doc comment) — once the handshake resolves their
            // identity, swap the still-unnamed placeholder for something
            // that actually distinguishes them, same convention as
            // ensureSyntheticPeer's "Relayed peer <hash>" below.
            const peer: Peer = {
              ...existing,
              name: existing.name ?? `Peer ${event.identityHash.slice(0, 8)}`,
              identityHash: event.identityHash,
            };
            this.incomingCentrals.set(event.peerId, peer);
            this.emit("event", { type: "peerUpdated", peer } satisfies BleEvent);
          }
          break;
        }

        const peripheral = this.peripherals.get(event.peerId);
        if (peripheral) {
          this.emit("event", { type: "peerUpdated", peer: this.toPeer(peripheral) } satisfies BleEvent);
        }
        break;
      }
      case "identityDisconnected":
        // Peer identity mapping is intentionally kept (not deleted) so
        // reconnects and store-and-forward delivery keep working.
        break;
      case "message": {
        const peerId = this.identityToPeerId.get(event.fromIdentityHash);
        const message: ChatMessage = {
          peerId: peerId ?? `identity:${event.fromIdentityHash}`,
          direction: "in",
          text: event.text,
          timestamp: event.timestamp,
          delivered: true,
        };
        if (!peerId) this.ensureSyntheticPeer(event.fromIdentityHash);
        this.emit("event", { type: "message", message } satisfies BleEvent);
        break;
      }
      case "messageQueued":
        // Nothing to do — the REST layer already emitted the outgoing
        // ChatMessage with delivered:false from sendMessage() above.
        break;
    }
  }

  private ensureSyntheticPeer(identityHash: string): void {
    if (this.syntheticPeers.has(identityHash)) return;
    const peer: Peer = {
      id: `identity:${identityHash}`,
      name: `Relayed peer ${identityHash.slice(0, 8)}`,
      rssi: -100,
      connectable: false,
      connected: false,
      lastSeen: Date.now(),
      identityHash,
      role: "central",
    };
    this.syntheticPeers.set(identityHash, peer);
    this.emit("event", { type: "peerDiscovered", peer } satisfies BleEvent);
  }

  private handleDiscover(peripheral: Peripheral): void {
    const isNew = !this.peripherals.has(peripheral.id);
    this.peripherals.set(peripheral.id, peripheral);
    const peer = this.toPeer(peripheral);
    this.emit("event", {
      type: isNew ? "peerDiscovered" : "peerUpdated",
      peer,
    } satisfies BleEvent);
  }

  private toPeer(peripheral: Peripheral): Peer {
    return {
      id: peripheral.id,
      name: peripheral.advertisement?.localName ?? null,
      rssi: peripheral.rssi,
      connectable: peripheral.connectable,
      connected: this.connections.has(peripheral.id),
      lastSeen: Date.now(),
      identityHash: this.peerIdentities.get(peripheral.id) ?? null,
      role: "central",
    };
  }
}

/** Pulls complete, delimiter-terminated messages out of a connection's receive buffer. */
function extractFramedMessages(conn: Connection): string[] {
  const messages: string[] = [];
  let delimiterIndex: number;
  while ((delimiterIndex = conn.recvBuffer.indexOf(MESSAGE_DELIMITER)) !== -1) {
    messages.push(conn.recvBuffer.subarray(0, delimiterIndex).toString("utf8"));
    conn.recvBuffer = conn.recvBuffer.subarray(delimiterIndex + 1);
  }
  return messages;
}

export const bleManager = new BleManager();
export type { Peer, ChatMessage, BleEvent } from "./types.js";
