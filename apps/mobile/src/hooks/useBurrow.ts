import { useCallback, useEffect, useRef, useState } from "react";
import { CENTRAL_PREFIX, central } from "../ble/central";
import { ensureAndroidBluetoothPermissions, openAppSettings } from "../ble/androidPermissions";
import { PERIPHERAL_PREFIX, peripheral, subscribeToPeripheralEvents } from "../ble/peripheral";
import type { ChatMessage, Peer } from "../ble/types";
import { mesh } from "../mesh/mesh";
import type { MeshEvent } from "../mesh/router";

function stripPrefix(prefixedPeerId: string): string | null {
  if (prefixedPeerId.startsWith(CENTRAL_PREFIX)) return prefixedPeerId.slice(CENTRAL_PREFIX.length);
  if (prefixedPeerId.startsWith(PERIPHERAL_PREFIX)) return prefixedPeerId.slice(PERIPHERAL_PREFIX.length);
  return null;
}

export type Burrow = ReturnType<typeof useBurrow>;

export function useBurrow() {
  const [peers, setPeers] = useState<Map<string, Peer>>(new Map());
  const [messages, setMessages] = useState<Map<string, ChatMessage[]>>(new Map());
  const [scanning, setScanning] = useState(false);
  const [advertising, setAdvertising] = useState(false);
  const [advertisingError, setAdvertisingError] = useState<string | null>(null);
  const [centralState, setCentralState] = useState("Unknown");
  const [peripheralState, setPeripheralState] = useState("unknown");
  const [connectingPeerId, setConnectingPeerId] = useState<string | null>(null);
  const [peerErrors, setPeerErrors] = useState<Map<string, string>>(new Map());

  // fromIdentityHash -> raw (unprefixed) peer id, so an incoming router
  // "message" event can be filed under the same peer the UI already knows.
  const identityToPeerId = useRef(new Map<string, string>());

  const clearPeerError = useCallback((id: string) => {
    setPeerErrors((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const appendMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => {
      const next = new Map(prev);
      const list = next.get(message.peerId) ?? [];
      next.set(message.peerId, [...list, message]);
      return next;
    });
  }, []);

  const ensureSyntheticPeer = useCallback((identityHash: string) => {
    const id = `identity:${identityHash}`;
    setPeers((prev) => {
      if (prev.has(id)) return prev;
      const peer: Peer = {
        id,
        name: `Relayed peer ${identityHash.slice(0, 8)}`,
        rssi: null,
        connected: false,
        role: "central",
        lastSeen: Date.now(),
        identityHash,
      };
      return new Map(prev).set(id, peer);
    });
    return id;
  }, []);

  useEffect(() => {
    const offCentral = central.on((event) => {
      switch (event.type) {
        case "stateChange":
          setCentralState(event.state);
          break;
        case "scanState":
          setScanning(event.scanning);
          break;
        case "peerDiscovered":
          setPeers((prev) => {
            const existing = prev.get(event.peer.id);
            return new Map(prev).set(event.peer.id, { ...event.peer, identityHash: existing?.identityHash ?? null });
          });
          break;
        case "peerDisconnected":
          setPeers((prev) => {
            const existing = prev.get(event.peer.id);
            return new Map(prev).set(event.peer.id, {
              ...event.peer,
              identityHash: existing?.identityHash ?? null,
            });
          });
          break;
        case "error":
          console.warn("[burrow] central error:", event.message);
          break;
      }
    });

    const offPeripheral = subscribeToPeripheralEvents((event) => {
      switch (event.type) {
        case "stateChange":
          setPeripheralState(event.state);
          break;
        case "advertisingStateChange":
          setAdvertising(event.advertising);
          setAdvertisingError(event.error ?? null);
          if (event.error) console.warn("[burrow] advertising error:", event.error);
          break;
        case "centralSubscribed":
          setPeers((prev) =>
            new Map(prev).set(event.centralId, {
              id: event.centralId,
              name: "Nearby phone",
              rssi: null,
              connected: true,
              role: "peripheral",
              lastSeen: Date.now(),
              identityHash: prev.get(event.centralId)?.identityHash ?? null,
            }),
          );
          break;
        case "centralUnsubscribed":
          setPeers((prev) => {
            const existing = prev.get(event.centralId);
            if (!existing) return prev;
            return new Map(prev).set(event.centralId, { ...existing, connected: false });
          });
          break;
      }
    });

    let offRouter: (() => void) | undefined;
    mesh
      .getRouter()
      .then((router) => {
        offRouter = router.on((event: MeshEvent) => {
          switch (event.type) {
            case "identityConnected": {
              const rawId = stripPrefix(event.peerId);
              if (!rawId) break;
              identityToPeerId.current.set(event.identityHash, rawId);
              setPeers((prev) => {
                const existing = prev.get(rawId);
                if (!existing) return prev;
                // CoreBluetooth's peripheral role has no API to read the
                // connecting central's device name (Apple withholds it for
                // privacy), so incoming phone-role connections start out as
                // the generic "Nearby phone" placeholder. Now that the mesh
                // handshake has given us their real cryptographic identity,
                // swap in something that actually distinguishes them —
                // same "Peer <hash>" convention used for relayed peers below.
                const name = existing.name === "Nearby phone" ? `Peer ${event.identityHash.slice(0, 8)}` : existing.name;
                return new Map(prev).set(rawId, { ...existing, name, identityHash: event.identityHash });
              });
              break;
            }
            case "message": {
              const peerId = identityToPeerId.current.get(event.fromIdentityHash) ?? ensureSyntheticPeer(event.fromIdentityHash);
              appendMessage({
                peerId,
                direction: "in",
                text: event.text,
                timestamp: event.timestamp,
                delivered: true,
              });
              break;
            }
            case "identityDisconnected":
            case "messageQueued":
              break; // reflected via central/peripheral's own connection events and sendMessage's return value
          }
        });
      })
      .catch((err) => console.warn("[burrow] mesh router init failed:", err));

    return () => {
      offCentral();
      offPeripheral();
      offRouter?.();
    };
  }, [appendMessage, ensureSyntheticPeer]);

  const startScan = useCallback(() => central.startScan(), []);
  const stopScan = useCallback(() => central.stopScan(), []);
  const [permissionBlocked, setPermissionBlocked] = useState(false);

  const startAdvertising = useCallback(async (localName: string) => {
    setAdvertisingError(null);
    // Re-request every time rather than only once at app launch — Android
    // won't show its dialog again once denied, but WILL the moment the user
    // re-grants it from Settings, so this naturally recovers once they do.
    const outcome = await ensureAndroidBluetoothPermissions();
    if (outcome === "blocked") {
      setPermissionBlocked(true);
      setAdvertisingError(
        "Bluetooth permission was denied. Tap “Open settings” below to grant it, then try again.",
      );
      return;
    }
    if (outcome === "denied") {
      setAdvertisingError("Bluetooth permission is required to advertise.");
      return;
    }
    setPermissionBlocked(false);
    peripheral.startAdvertising(localName);
  }, []);
  const stopAdvertising = useCallback(() => peripheral.stopAdvertising(), []);

  const connectPeer = useCallback(
    async (id: string) => {
      setConnectingPeerId(id);
      clearPeerError(id);
      try {
        await central.connect(id);
      } catch (err) {
        setPeerErrors((prev) => new Map(prev).set(id, (err as Error).message));
      } finally {
        setConnectingPeerId((current) => (current === id ? null : current));
      }
    },
    [clearPeerError],
  );

  const disconnectPeer = useCallback((id: string) => central.disconnect(id), []);

  const sendMessage = useCallback(
    async (peer: Peer, text: string) => {
      clearPeerError(peer.id);
      if (!peer.identityHash) {
        setPeerErrors((prev) => new Map(prev).set(peer.id, "Still establishing a secure connection — try again in a moment."));
        return;
      }
      try {
        const router = await mesh.getRouter();
        const { delivered } = await router.sendToIdentity(peer.identityHash, text);
        appendMessage({ peerId: peer.id, direction: "out", text, timestamp: Date.now(), delivered });
      } catch (err) {
        setPeerErrors((prev) => new Map(prev).set(peer.id, (err as Error).message));
      }
    },
    [appendMessage, clearPeerError],
  );

  return {
    peers: [...peers.values()].sort((a, b) => (b.rssi ?? -999) - (a.rssi ?? -999)),
    messages,
    scanning,
    advertising,
    advertisingError,
    permissionBlocked,
    openPermissionSettings: openAppSettings,
    centralState,
    peripheralState,
    connectingPeerId,
    peerErrors,
    startScan,
    stopScan,
    startAdvertising,
    stopAdvertising,
    connectPeer,
    disconnectPeer,
    sendMessage,
  };
}
