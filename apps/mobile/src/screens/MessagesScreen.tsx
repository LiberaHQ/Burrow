import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import type { Burrow } from "../hooks/useBurrow";
import type { Peer } from "../ble/types";
import { ChatThread } from "../components/ChatThread";
import { shadow, theme } from "../lib/theme";

export function MessagesScreen({
  burrow,
  selectedPeerId,
  onSelectPeer,
}: {
  burrow: Burrow;
  selectedPeerId: string | null;
  onSelectPeer: (peerId: string | null) => void;
}) {
  const selectedPeer = burrow.peers.find((p) => p.id === selectedPeerId) ?? null;

  if (selectedPeer) {
    const thread = burrow.messages.get(selectedPeer.id) ?? [];
    const error = burrow.peerErrors.get(selectedPeer.id);
    const isConnecting = burrow.connectingPeerId === selectedPeer.id;
    return (
      <ChatThread
        peer={selectedPeer}
        thread={thread}
        error={error}
        isConnecting={isConnecting}
        onBack={() => onSelectPeer(null)}
        onConnect={() => burrow.connectPeer(selectedPeer.id)}
        onDisconnect={() => burrow.disconnectPeer(selectedPeer.id)}
        onSend={(text) => burrow.sendMessage(selectedPeer, text)}
      />
    );
  }

  // Conversations = peers we've completed a secure handshake with at some
  // point (identityHash set), regardless of whether they're connected right
  // now — store-and-forward means you can still queue a message for them.
  const conversations = burrow.peers
    .filter((p) => p.identityHash)
    .sort((a, b) => {
      const lastA = lastMessageTime(burrow, a.id);
      const lastB = lastMessageTime(burrow, b.id);
      return lastB - lastA;
    });

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>
      <FlatList
        data={conversations}
        keyExtractor={(p) => p.id}
        contentContainerStyle={conversations.length === 0 ? styles.flex : styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyState}>
            No secured conversations yet.{"\n"}Connect to a peer from the Peers tab to start one.
          </Text>
        }
        renderItem={({ item }) => <ConversationRow burrow={burrow} peer={item} onPress={() => onSelectPeer(item.id)} />}
      />
    </View>
  );
}

function lastMessageTime(burrow: Burrow, peerId: string): number {
  const list = burrow.messages.get(peerId);
  if (!list || list.length === 0) return 0;
  return list[list.length - 1].timestamp;
}

function ConversationRow({ burrow, peer, onPress }: { burrow: Burrow; peer: Peer; onPress: () => void }) {
  const list = burrow.messages.get(peer.id) ?? [];
  const last = list[list.length - 1];
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]} onPress={onPress}>
      <View style={styles.rowMain}>
        <Text style={styles.rowName}>{peer.name ?? peer.id}</Text>
        <Text style={styles.rowPreview} numberOfLines={1}>
          {last ? last.text : peer.connected ? "Connected — say hello" : "Not connected right now"}
        </Text>
      </View>
      {last && !last.delivered && <Text style={styles.queuedBadge}>queued</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  flex: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border },
  title: { color: theme.foreground, fontSize: 22, fontWeight: "800", letterSpacing: -0.3 },
  list: { padding: 16, gap: 8 },
  row: {
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
  rowPressed: { opacity: 0.75 },
  rowMain: { flex: 1, marginRight: 8 },
  rowName: { color: theme.foreground, fontSize: 16, fontWeight: "600" },
  rowPreview: { color: theme.textSecondary, fontSize: 13, marginTop: 2 },
  queuedBadge: { color: theme.textSecondary, fontSize: 11, fontStyle: "italic" },
  emptyState: { color: theme.textSecondary, textAlign: "center", marginTop: 40, lineHeight: 20 },
});
