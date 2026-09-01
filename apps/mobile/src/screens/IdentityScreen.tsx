import React, { useEffect, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { bytesToBase64 } from "../ble/base64";
import { mesh } from "../mesh/mesh";
import { shadow, theme } from "../lib/theme";

export function IdentityScreen() {
  const [identity, setIdentity] = useState<{ hash: string; publicKey: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    mesh
      .getIdentity()
      .then((id) => {
        if (cancelled) return;
        setIdentity({ hash: id.hash, publicKey: bytesToBase64(id.publicKey) });
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn("[burrow] failed to load own identity:", err);
        setError((err as Error).message);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Identity</Text>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Couldn't load your identity: {error}</Text>
          <Pressable
            style={({ pressed }) => [styles.retryButton, pressed && styles.pressedFade]}
            onPress={() => setAttempt((n) => n + 1)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : !identity ? (
        <Text style={styles.emptyState}>Loading identity…</Text>
      ) : (
        <>
          <View style={styles.field}>
            <Text style={styles.label}>Identity hash</Text>
            {/* `selectable` enables the native long-press "Copy" menu on iOS — no extra clipboard package needed. */}
            <Text style={styles.value} selectable>
              {identity.hash}
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Public key</Text>
            <Text style={styles.value} selectable>
              {identity.publicKey}
            </Text>
          </View>

          <Text style={styles.note}>
            This is a NaCl (X25519) keypair generated on first run and stored in this app's local storage.
            Messages are end-to-end encrypted to a peer's public key, and peers are addressed by the hash above
            rather than by Bluetooth address. Long-press either value to copy it.
          </Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  content: { padding: 16, gap: 16 },
  title: { color: theme.foreground, fontSize: 22, fontWeight: "800", letterSpacing: -0.3 },
  emptyState: { color: theme.textSecondary, fontSize: 14 },
  errorBox: { backgroundColor: theme.danger, borderRadius: 12, padding: 14, gap: 10 },
  errorText: { color: theme.dangerText, fontSize: 13 },
  retryButton: { alignSelf: "flex-start", backgroundColor: theme.accentDim, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  pressedFade: { opacity: 0.7 },
  retryButtonText: { color: theme.accent, fontSize: 13, fontWeight: "600" },
  field: {
    backgroundColor: theme.cardBg,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 7,
    ...shadow.sm,
  },
  label: { color: theme.textSecondary, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6 },
  value: { color: theme.foreground, fontSize: 14, fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }) },
  note: { color: theme.textSecondary, fontSize: 12, lineHeight: 18 },
});
