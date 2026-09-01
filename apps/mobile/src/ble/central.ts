import { BleManager, type Device, type Subscription } from "react-native-ble-plx";
import { base64ToBytes, bytesToBase64, utf8Decode, utf8Encode } from "./base64";
import { mesh } from "../mesh/mesh";
import type { Peer } from "./types";

// Same Nordic UART Service UUIDs as apps/server/src/ble/scanner.ts and the
// native BurrowPeripheral module — this is what makes this app able to
// talk to the desktop app (and vice versa).
const UART_SERVICE_UUID = "6E400001-B5A3-F393-E0A9-E50E24DCCA9E";
const UART_RX_CHAR_UUID = "6E400002-B5A3-F393-E0A9-E50E24DCCA9E"; // write: us -> peer
const UART_TX_CHAR_UUID = "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"; // notify: peer -> us

const WRITE_CHUNK_BYTES = 20;
const MESSAGE_DELIMITER = 0x0a; // '\n' — same framing as the desktop/native peripheral side

/** Central-role peer ids are prefixed before being handed to the shared mesh
 *  router, since peripheral-role centralIds live in a separate id namespace. */
export const CENTRAL_PREFIX = "central:";

interface Connection {
  device: Device;
  notifySub: Subscription;
  /** Raw undecoded bytes awaiting a delimiter; decoding per-chunk would
   *  corrupt any multi-byte UTF-8 character split across a chunk boundary. */
  recvBuffer: number[];
}

export type CentralEvent =
  | { type: "stateChange"; state: string }
  | { type: "scanState"; scanning: boolean }
  | { type: "peerDiscovered"; peer: Peer }
  | { type: "peerDisconnected"; peer: Peer }
  | { type: "error"; message: string };

class Central {
  private manager = new BleManager();
  private devices = new Map<string, Device>();
  private connections = new Map<string, Connection>();
  private scanning = false;
  private listeners = new Set<(event: CentralEvent) => void>();

  constructor() {
    this.manager.onStateChange((state) => this.emit({ type: "stateChange", state }), true);
    mesh.registerTransport(CENTRAL_PREFIX, (peerId, text) => this.rawSend(peerId, text));
  }

  on(handler: (event: CentralEvent) => void): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  private emit(event: CentralEvent) {
    for (const l of this.listeners) l(event);
  }

  get isScanning(): boolean {
    return this.scanning;
  }

  listPeers(): Peer[] {
    return [...this.devices.values()].map((d) => this.toPeer(d));
  }

  async startScan(): Promise<void> {
    this.scanning = true;
    this.emit({ type: "scanState", scanning: true });
    this.manager.startDeviceScan(null, { allowDuplicates: true }, (error, device) => {
      if (error) {
        this.emit({ type: "error", message: error.message });
        return;
      }
      if (!device) return;
      this.devices.set(device.id, device);
      this.emit({ type: "peerDiscovered", peer: this.toPeer(device) });
    });
  }

  async stopScan(): Promise<void> {
    await this.manager.stopDeviceScan();
    this.scanning = false;
    this.emit({ type: "scanState", scanning: false });
  }

  async connect(peerId: string): Promise<void> {
    const device = this.devices.get(peerId);
    if (!device) throw new Error(`Unknown peer: ${peerId}`);

    const connected = await device.connect();
    try {
      await connected.discoverAllServicesAndCharacteristics();

      const notifySub = connected.monitorCharacteristicForService(
        UART_SERVICE_UUID,
        UART_TX_CHAR_UUID,
        (error, characteristic) => {
          if (error || !characteristic?.value) return;
          const conn = this.connections.get(peerId);
          if (!conn) return;
          conn.recvBuffer.push(...Array.from(base64ToBytes(characteristic.value)));
          this.flushMessages(peerId, conn);
        },
      );

      this.connections.set(peerId, { device: connected, notifySub, recvBuffer: [] });

      connected.onDisconnected(() => {
        this.connections.get(peerId)?.notifySub.remove();
        this.connections.delete(peerId);
        mesh
          .getRouter()
          .then((router) => router.handleDisconnect(CENTRAL_PREFIX + peerId))
          .catch(() => undefined);
        this.emit({ type: "peerDisconnected", peer: this.toPeer(connected) });
      });

      const router = await mesh.getRouter();
      await router.initiateHandshake(CENTRAL_PREFIX + peerId);
    } catch (err) {
      await connected.cancelConnection().catch(() => undefined);
      throw err;
    }
  }

  async disconnect(peerId: string): Promise<void> {
    const conn = this.connections.get(peerId);
    if (!conn) return;
    await conn.device.cancelConnection();
  }

  /** Registered with the shared mesh router as the "central:" transport. */
  private async rawSend(prefixedPeerId: string, text: string): Promise<void> {
    const peerId = prefixedPeerId.slice(CENTRAL_PREFIX.length);
    const conn = this.connections.get(peerId);
    if (!conn) throw new Error(`Not connected to peer: ${peerId}`);

    const framed = text + "\n";
    const bytes = utf8Encode(framed);
    for (let offset = 0; offset < bytes.length; offset += WRITE_CHUNK_BYTES) {
      const chunk = bytes.subarray(offset, offset + WRITE_CHUNK_BYTES);
      const base64 = bytesToBase64(chunk);
      await conn.device.writeCharacteristicWithoutResponseForService(UART_SERVICE_UUID, UART_RX_CHAR_UUID, base64);
    }
  }

  private flushMessages(peerId: string, conn: Connection) {
    let index: number;
    while ((index = conn.recvBuffer.indexOf(MESSAGE_DELIMITER)) !== -1) {
      const text = utf8Decode(conn.recvBuffer.slice(0, index));
      conn.recvBuffer = conn.recvBuffer.slice(index + 1);
      mesh
        .getRouter()
        .then((router) => router.handleIncoming(CENTRAL_PREFIX + peerId, text))
        .catch((err) => this.emit({ type: "error", message: String(err) }));
    }
  }

  private toPeer(device: Device): Peer {
    return {
      id: device.id,
      name: device.name ?? device.localName ?? null,
      rssi: device.rssi ?? null,
      connected: this.connections.has(device.id),
      role: "central",
      lastSeen: Date.now(),
      identityHash: null, // resolved by useBurrow from the router's identityConnected events
    };
  }
}

export const central = new Central();
