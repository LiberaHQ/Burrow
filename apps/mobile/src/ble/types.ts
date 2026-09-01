export type PeerRole = "central" | "peripheral";

export interface Peer {
  id: string;
  name: string | null;
  rssi: number | null;
  connected: boolean;
  /**
   * "central": we discovered and connected out to them (we're the BLE central).
   * "peripheral": they connected to us while we were advertising (we're the peripheral).
   */
  role: PeerRole;
  lastSeen: number;
  /** Set once the end-to-end handshake completes; null until then (or if never connected). */
  identityHash: string | null;
}

export interface ChatMessage {
  peerId: string;
  direction: "in" | "out";
  text: string;
  timestamp: number;
  /** false while queued for offline/store-and-forward delivery, true once actually sent/received. */
  delivered: boolean;
}
