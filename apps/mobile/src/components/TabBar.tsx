import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../lib/theme";
import { HomeIcon, IdentityIcon, MessagesIcon, PeersIcon } from "./Icons";

export type TabId = "home" | "messages" | "peers" | "identity";

const TABS: { id: TabId; label: string; Icon: React.ComponentType<{ size?: number; color?: string }> }[] = [
  { id: "home", label: "Home", Icon: HomeIcon },
  { id: "messages", label: "Messages", Icon: MessagesIcon },
  { id: "peers", label: "Peers", Icon: PeersIcon },
  { id: "identity", label: "Identity", Icon: IdentityIcon },
];

/** Bottom tab bar — the mobile equivalent of the desktop app's left sidebar nav. */
export function TabBar({ active, onChange }: { active: TabId; onChange: (id: TabId) => void }) {
  return (
    <View style={styles.bar}>
      {TABS.map(({ id, label, Icon }) => {
        const isActive = id === active;
        return (
          <Pressable
            key={id}
            style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
            onPress={() => onChange(id)}
            hitSlop={8}
          >
            {isActive && <View style={styles.activeDot} />}
            <Icon size={21} color={isActive ? theme.accent : theme.textSecondary} />
            <Text style={[styles.label, isActive && styles.labelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: theme.border,
    backgroundColor: theme.background,
    paddingTop: 10,
  },
  tab: { flex: 1, alignItems: "center", paddingBottom: 8, gap: 3, borderRadius: 8 },
  tabPressed: { opacity: 0.6 },
  activeDot: {
    position: "absolute",
    top: -10,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.accent,
  },
  label: { fontSize: 11, color: theme.textSecondary, fontWeight: "500" },
  labelActive: { color: theme.accent, fontWeight: "700" },
});
