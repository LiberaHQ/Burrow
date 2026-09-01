import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { describeBtStatus } from "../lib/btStatus";
import { theme } from "../lib/theme";

const DOT_COLOR = { ok: "#4ade80", warn: "#fbbf24", off: theme.textSecondary } as const;

export function StatusBadge({ centralState, peripheralState }: { centralState: string; peripheralState: string }) {
  const status = describeBtStatus(centralState, peripheralState);
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: DOT_COLOR[status.tone] }]} />
      <Text style={styles.label}>{status.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { color: theme.textSecondary, fontSize: 12, flexShrink: 1 },
});
