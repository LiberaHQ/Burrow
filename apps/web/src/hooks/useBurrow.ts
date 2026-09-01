"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { WS_URL, api } from "@/lib/api";
import type { BleEvent, ChatMessage, Peer, Snapshot } from "@/lib/types";

export type Burrow = ReturnType<typeof useBurrow>;

export function useBurrow() {
  const [peers, setPeers] = useState<Map<string, Peer>>(new Map());
  const [messages, setMessages] = useState<Map<string, ChatMessage[]>>(new Map());
  const [scanning, setScanning] = useState(false);
  const [adapterState, setAdapterState] = useState("unknown");
  const [advertising, setAdvertising] = useState(false);
  const [peripheralSupported, setPeripheralSupported] = useState(false);
  const [advertisingError, setAdvertisingError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [connectingPeerId, setConnectingPeerId] = useState<string | null>(null);
  const [peerErrors, setPeerErrors] = useState<Map<string, string>>(new Map());
  const [unreadCount, setUnreadCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data) as BleEvent | Snapshot;

      if (data.type === "snapshot") {
        setPeers(new Map(data.peers.map((p) => [p.id, p])));
        setScanning(data.scanning);
        setAdapterState(data.adapterState);
        setAdvertising(data.advertising);
        setPeripheralSupported(data.peripheralSupported);
        return;
      }

      switch (data.type) {
        case "peerDiscovered":
        case "peerUpdated":
        case "peerConnected":
        case "peerDisconnected":
          setPeers((prev) => new Map(prev).set(data.peer.id, data.peer));
          break;
        case "message":
          setMessages((prev) => {
            const next = new Map(prev);
            const list = next.get(data.message.peerId) ?? [];
            next.set(data.message.peerId, [...list, data.message]);
            return next;
          });
          if (data.message.direction === "in") {
            setUnreadCount((n) => n + 1);
          }
          break;
        case "scanState":
          setScanning(data.scanning);
          break;
        case "advertisingState":
          setAdvertising(data.advertising);
          setAdvertisingError(data.error ?? null);
          break;
        case "error":
          console.error("[burrow] BLE error:", data.message);
          break;
      }
    };

    const connect = () => {
      if (cancelled) return;
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => setWsConnected(true);
      ws.onerror = () => ws.close();
      ws.onmessage = handleMessage;
      ws.onclose = () => {
        setWsConnected(false);
        if (!cancelled) retryTimer = setTimeout(connect, 1500);
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      wsRef.current?.close();
    };
  }, []);

  const clearPeerError = useCallback((id: string) => {
    setPeerErrors((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const startScan = useCallback(() => api.startScan(), []);
  const stopScan = useCallback(() => api.stopScan(), []);

  const startAdvertising = useCallback(async (name: string) => {
    setAdvertisingError(null);
    try {
      await api.startAdvertising(name);
    } catch (err) {
      setAdvertisingError((err as Error).message);
    }
  }, []);
  const stopAdvertising = useCallback(() => api.stopAdvertising(), []);

  const connectPeer = useCallback(async (id: string) => {
    setConnectingPeerId(id);
    clearPeerError(id);
    try {
      await api.connectPeer(id);
    } catch (err) {
      setPeerErrors((prev) => new Map(prev).set(id, (err as Error).message));
    } finally {
      setConnectingPeerId((current) => (current === id ? null : current));
    }
  }, [clearPeerError]);

  const disconnectPeer = useCallback((id: string) => api.disconnectPeer(id), []);

  const markMessagesRead = useCallback(() => setUnreadCount(0), []);

  const sendMessage = useCallback(async (id: string, text: string) => {
    clearPeerError(id);
    try {
      await api.sendMessage(id, text);
    } catch (err) {
      setPeerErrors((prev) => new Map(prev).set(id, (err as Error).message));
    }
  }, [clearPeerError]);

  return {
    peers: [...peers.values()].sort((a, b) => b.rssi - a.rssi),
    messages,
    scanning,
    adapterState,
    advertising,
    peripheralSupported,
    advertisingError,
    wsConnected,
    connectingPeerId,
    peerErrors,
    unreadCount,
    markMessagesRead,
    startScan,
    stopScan,
    startAdvertising,
    stopAdvertising,
    connectPeer,
    disconnectPeer,
    sendMessage,
  };
}
