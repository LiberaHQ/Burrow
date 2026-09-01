import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import type { Burrow } from "../hooks/useBurrow";
import type { Peer } from "../ble/types";
import { StatusBadge } from "../components/StatusBadge";
import { shadow, theme } from "../lib/theme";

export function PeersScreen({
  burrow,
  localName,
  onOpenChat,
}: {
  burrow: Burrow;
  localName: string;
  onOpenChat: (peerId: string) => void;
}) {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Peers</Text>
        <View style={styles.status}>
          <StatusBadge centralState={burrow.centralState} peripheralState={burrow.peripheralState} />
        </View>
      </View>

      <View style={styles.controlsRow}>
        <Pressable
          style={({ pressed }) => [styles.controlButton, pressed && styles.pressedRaise]}
          onPress={() => (burrow.scanning ? burrow.stopScan() : burrow.startScan())}
        >
          <Text style={styles.controlButtonText}>{burrow.scanning ? "Stop scanning" : "Start scanning"}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.controlButton, pressed && styles.pressedRaise]}
          onPress={() => (burrow.advertising ? burrow.stopAdvertising() : burrow.startAdvertising(localName))}
        >
          <Text style={styles.controlButtonText}>
            {burrow.advertising ? "Stop advertising" : "Start advertising"}
          </Text>
        </Pressable>
      </View>

      {burrow.advertisingError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{burrow.advertisingError}</Text>
          {burrow.permissionBlocked && (
            <Pressable style={styles.errorButton} onPress={burrow.openPermissionSettings}>
              <Text style={styles.errorButtonText}>Open settings</Text>
            </Pressable>
          )}
        </View>
      )}

      <FlatList
        data={burrow.peers}
        keyExtractor={(p) => p.id}
        contentContainerStyle={burrow.peers.length === 0 ? styles.flex : styles.list}
        ListEmptyComponent={<Text style={styles.emptyState}>No peers yet.</Text>}
        renderItem={({ item }) => (
          <PeerRow
            peer={item}
            connecting={burrow.connectingPeerId === item.id}
            onPress={() => onOpenChat(item.id)}
            onConnect={() => burrow.connectPeer(item.id)}
            onDisconnect={() => burrow.disconnectPeer(item.id)}
          />
        )}
      />
    </View>
  );
}

function PeerRow({
  peer,
  connecting,
  onPress,
  onConnect,
  onDisconnect,
}: {
  peer: Peer;
  connecting: boolean;
  onPress: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const meta = [
    peer.role === "peripheral" ? "incoming" : "scanned",
    peer.rssi !== null ? `${peer.rssi} dBm` : null,
    peer.connected ? "connected" : "not connected",
    peer.identityHash ? `secured (${peer.identityHash.slice(0, 8)})` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  // A Pressable nested inside another Pressable is a known trouble spot under
  // React Native's New Architecture (Fabric) — the outer one can end up
  // claiming the touch responder before the inner one (the action button)
  // ever gets a chance to respond, making it look permanently unclickable.
  // Keep them as siblings in a plain View instead: one Pressable over the
  // name/meta text (tap to open chat), one over the action button.
  return (
    <View style={styles.peerRow}>
      <Pressable style={styles.peerInfo} onPress={onPress}>
        <Text style={styles.peerName}>{peer.name ?? peer.id}</Text>
        <Text style={styles.peerMeta}>{meta}</Text>
      </Pressable>
      {peer.role === "central" &&
        (peer.connected ? (
          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressedRaise]}
            onPress={onDisconnect}
            hitSlop={8}
          >
            <Text style={styles.actionButtonText}>Disconnect</Text>
          </Pressable>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressedRaise]}
            onPress={onConnect}
            disabled={connecting}
            hitSlop={8}
          >
            <Text style={styles.actionButtonText}>{connecting ? "Connecting…" : "Connect"}</Text>
          </Pressable>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    gap: 4,
  },
  title: { color: theme.foreground, fontSize: 22, fontWeight: "800", letterSpacing: -0.3 },
  status: { alignSelf: "stretch" }, // stretch to header width so the status label wraps instead of overflowing off-screen
  controlsRow: { flexDirection: "row", gap: 10, padding: 12 },
  controlButton: {
    flex: 1,
    backgroundColor: theme.cardBg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
    ...shadow.sm,
  },
  pressedRaise: { opacity: 0.75 },
  controlButtonText: { color: theme.foreground, fontSize: 14, fontWeight: "600" },
  errorBanner: {
    marginHorizontal: 12,
    marginBottom: 8,
    backgroundColor: theme.danger,
    borderRadius: 8,
    padding: 10,
  },
  errorText: { color: theme.dangerText, fontSize: 13 },
  errorButton: {
    alignSelf: "flex-start",
    marginTop: 8,
    backgroundColor: theme.accentDim,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  errorButtonText: { color: theme.accent, fontSize: 13, fontWeight: "600" },
  list: { paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
  peerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.cardBg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...shadow.sm,
  },
  peerInfo: { flex: 1, marginRight: 8 },
  peerName: { color: theme.foreground, fontSize: 16, fontWeight: "600" },
  peerMeta: { color: theme.textSecondary, fontSize: 12, marginTop: 2 },
  actionButton: { backgroundColor: theme.accentDim, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  actionButtonText: { color: theme.accent, fontSize: 13, fontWeight: "600" },
  emptyState: { color: theme.textSecondary, textAlign: "center", marginTop: 40 },
});
