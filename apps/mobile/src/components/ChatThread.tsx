import React, { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { ChatMessage, Peer } from "../ble/types";
import { shadow, theme } from "../lib/theme";

export function ChatThread({
  peer,
  thread,
  error,
  isConnecting,
  onBack,
  onConnect,
  onDisconnect,
  onSend,
}: {
  peer: Peer;
  thread: ChatMessage[];
  error?: string;
  isConnecting: boolean;
  onBack: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onSend: (text: string) => void;
}) {
  const [draft, setDraft] = useState("");

  const handleSend = () => {
    if (!draft.trim()) return;
    onSend(draft.trim());
    setDraft("");
  };

  const meta = [
    `${peer.rssi} dBm`,
    isConnecting ? "connecting…" : peer.identityHash ? `secured (${peer.identityHash.slice(0, 8)})` : "establishing secure connection…",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.chatHeader}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={styles.backLink}>‹</Text>
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.chatTitle} numberOfLines={1}>
            {peer.name ?? peer.id}
          </Text>
          <Text style={styles.chatMeta} numberOfLines={1}>
            {meta}
          </Text>
        </View>
        {peer.role === "central" &&
          (peer.connected ? (
            <Pressable
              style={({ pressed }) => [styles.headerButton, pressed && styles.pressedFade]}
              onPress={onDisconnect}
            >
              <Text style={styles.headerButtonText}>{isConnecting ? "Cancel" : "Disconnect"}</Text>
            </Pressable>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.headerButton, pressed && styles.pressedFade]}
              onPress={onConnect}
              disabled={isConnecting}
            >
              <Text style={styles.headerButtonText}>{isConnecting ? "Connecting…" : "Connect"}</Text>
            </Pressable>
          ))}
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        style={styles.flex}
        contentContainerStyle={styles.threadContent}
        data={thread}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <View style={item.direction === "out" ? styles.bubbleOut : styles.bubbleIn}>
            <Text style={item.direction === "out" ? styles.bubbleTextOut : styles.bubbleTextIn}>{item.text}</Text>
            {!item.delivered && <Text style={styles.queuedTag}> queued…</Text>}
          </View>
        )}
      />

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder={
            peer.identityHash
              ? peer.connected
                ? "Message…"
                : "Message… (will queue until they're back)"
              : "Connect to establish a secure channel first"
          }
          placeholderTextColor={theme.textSecondary}
          editable={!!peer.identityHash}
          onSubmitEditing={handleSend}
        />
        <Pressable
          style={({ pressed }) => [
            styles.sendButton,
            !peer.identityHash && styles.sendButtonDisabled,
            pressed && styles.pressedFade,
          ]}
          onPress={handleSend}
          disabled={!peer.identityHash}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backLink: { color: theme.accent, fontSize: 26, fontWeight: "300", paddingRight: 2 },
  headerText: { flex: 1 },
  chatTitle: { color: theme.foreground, fontSize: 16, fontWeight: "700" },
  chatMeta: { color: theme.textSecondary, fontSize: 12, marginTop: 1 },
  headerButton: { backgroundColor: theme.accentDim, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  pressedFade: { opacity: 0.7 },
  headerButtonText: { color: theme.accent, fontSize: 13, fontWeight: "600" },
  errorBanner: { backgroundColor: theme.danger, marginHorizontal: 12, marginTop: 8, borderRadius: 8, padding: 10 },
  errorText: { color: theme.dangerText, fontSize: 13 },
  threadContent: { padding: 16, gap: 7 },
  bubbleIn: {
    alignSelf: "flex-start",
    backgroundColor: theme.cardBg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    borderBottomLeftRadius: 4,
    padding: 11,
    maxWidth: "75%",
    ...shadow.sm,
  },
  bubbleOut: {
    alignSelf: "flex-end",
    backgroundColor: theme.accent,
    borderRadius: 14,
    borderBottomRightRadius: 4,
    padding: 11,
    maxWidth: "75%",
    ...shadow.accent,
  },
  bubbleTextIn: { color: theme.foreground, fontSize: 15, lineHeight: 20 },
  bubbleTextOut: { color: theme.onAccent, fontSize: 15, lineHeight: 20 },
  queuedTag: { color: theme.textSecondary, fontSize: 11, fontStyle: "italic" },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  input: {
    flex: 1,
    backgroundColor: theme.cardBg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 9,
    color: theme.foreground,
    fontSize: 15,
  },
  sendButton: { backgroundColor: theme.accent, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9, ...shadow.accent },
  sendButtonDisabled: { opacity: 0.4, shadowOpacity: 0, elevation: 0 },
  sendButtonText: { color: theme.onAccent, fontSize: 14, fontWeight: "700" },
});
