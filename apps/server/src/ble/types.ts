export interface Peer {
  id: string;
  name: string | null;
  rssi: number;
  connectable: boolean;
  connected: boolean;
  lastSeen: number;
  /** Set once the end-to-end handshake completes; null until then (or if never connected). */
  identityHash: string | null;
  /**
   * "central": we discovered and connected out to them (the classic case).
   * "peripheral": they connected to us while we were advertising — there's
   * no BLE API to read a connecting central's device name, so these start
   * out unnamed until the mesh handshake resolves their identity.
   */
  role: "central" | "peripheral";
}

export interface ChatMessage {
  peerId: string;
  direction: "in" | "out";
  text: string;
  timestamp: number;
  /** false while queued for offline/store-and-forward delivery, true once actually sent/received. */
  delivered: boolean;
}

export type BleEvent =
  | { type: "peerDiscovered"; peer: Peer }
  | { type: "peerUpdated"; peer: Peer }
  | { type: "peerConnected"; peer: Peer }
  | { type: "peerDisconnected"; peer: Peer }
  | { type: "message"; message: ChatMessage }
  | { type: "scanState"; scanning: boolean }
  | { type: "advertisingState"; advertising: boolean; error?: string }
  | { type: "error"; message: string };
