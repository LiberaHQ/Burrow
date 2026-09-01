import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { Burrow } from "../hooks/useBurrow";
import type { TabId } from "../components/TabBar";
import { StatusBadge } from "../components/StatusBadge";
import { MessagesIcon, PeersIcon } from "../components/Icons";
import { shadow, theme } from "../lib/theme";

export function HomeScreen({
  burrow,
  onNavigate,
  onOpenChat,
}: {
  burrow: Burrow;
  onNavigate: (tab: TabId) => void;
  onOpenChat: (peerId: string) => void;
}) {
  const securedCount = burrow.peers.filter((p) => p.identityHash).length;
  const recentMessages = [...burrow.messages.entries()]
    .flatMap(([peerId, list]) => list.map((m) => ({ ...m, peerId })))
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 4);
  const peerName = (id: string) => burrow.peers.find((p) => p.id === id)?.name ?? id;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Burrow</Text>
        <StatusBadge centralState={burrow.centralState} peripheralState={burrow.peripheralState} />
      </View>

      <View style={styles.actionRow}>
        <Pressable
          style={({ pressed }) => [styles.actionButton, pressed && styles.pressedRaise]}
          onPress={() => {
            burrow.startScan();
            onNavigate("peers");
          }}
        >
          <PeersIcon size={17} color={theme.foreground} />
          <Text style={styles.actionButtonText}>Find peers</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.actionButton, pressed && styles.pressedRaise]}
          onPress={() => onNavigate("messages")}
        >
          <MessagesIcon size={17} color={theme.foreground} />
          <Text style={styles.actionButtonText}>Messages</Text>
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{burrow.peers.length}</Text>
          <Text style={styles.statLabel}>peers seen</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{securedCount}</Text>
          <Text style={styles.statLabel}>secured</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent messages</Text>
      {recentMessages.length === 0 ? (
        <Text style={styles.emptyState}>No messages yet — connect to a peer to start chatting.</Text>
      ) : (
        recentMessages.map((m, i) => (
          <Pressable
            key={i}
            style={({ pressed }) => [styles.messageRow, pressed && styles.pressedRaise]}
            onPress={() => onOpenChat(m.peerId)}
          >
            <Text style={styles.messageName}>{peerName(m.peerId)}</Text>
            <Text style={styles.messageText} numberOfLines={1}>
              {m.text}
            </Text>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  content: { padding: 16, gap: 18 },
  headerRow: { gap: 6 },
  title: { color: theme.foreground, fontSize: 28, fontWeight: "800", letterSpacing: -0.4 },
  actionRow: { flexDirection: "row", gap: 10 },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: theme.cardBg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...shadow.sm,
  },
  pressedRaise: { opacity: 0.75 },
  actionButtonText: { color: theme.foreground, fontSize: 14, fontWeight: "600" },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: theme.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    ...shadow.sm,
  },
  statValue: { color: theme.accent, fontSize: 26, fontWeight: "800", letterSpacing: -0.3 },
  statLabel: { color: theme.textSecondary, fontSize: 12, marginTop: 3, fontWeight: "500" },
  sectionTitle: { color: theme.foreground, fontSize: 15, fontWeight: "700", marginTop: 2 },
  emptyState: { color: theme.textSecondary, fontSize: 13, lineHeight: 18 },
  messageRow: {
    backgroundColor: theme.cardBg,
    borderRadius: 12,
    padding: 13,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 3,
    ...shadow.sm,
  },
  messageName: { color: theme.foreground, fontSize: 14, fontWeight: "600" },
  messageText: { color: theme.textSecondary, fontSize: 13 },
});
