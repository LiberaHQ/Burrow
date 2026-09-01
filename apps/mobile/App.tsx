import React, { useCallback, useEffect, useState } from "react";
import { LayoutAnimation, StatusBar, StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useBurrow } from "./src/hooks/useBurrow";
import { ensureAndroidBluetoothPermissions } from "./src/ble/androidPermissions";
import { TabBar, type TabId } from "./src/components/TabBar";
import { HomeScreen } from "./src/screens/HomeScreen";
import { MessagesScreen } from "./src/screens/MessagesScreen";
import { PeersScreen } from "./src/screens/PeersScreen";
import { IdentityScreen } from "./src/screens/IdentityScreen";
import { theme } from "./src/lib/theme";

const LOCAL_NAME = "Burrow";

function App() {
  const burrow = useBurrow();
  const [tab, setTab] = useState<TabId>("home");
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null);

  useEffect(() => {
    ensureAndroidBluetoothPermissions();
  }, []);

  // A quick cross-fade on tab switches — cheap way to make screen changes
  // feel intentional instead of an instant, jarring swap. LayoutAnimation
  // animates whatever changes in the very next render, so it must be
  // triggered right before the state update that causes that render.
  const changeTab = useCallback((next: TabId) => {
    LayoutAnimation.configureNext(LayoutAnimation.create(180, "easeInEaseOut", "opacity"));
    setTab(next);
  }, []);

  const openChat = (peerId: string) => {
    setSelectedPeerId(peerId);
    changeTab("messages");
  };

  return (
    // react-native core's own SafeAreaView is effectively iOS-only — on
    // Android it doesn't account for the system nav bar (3-button or
    // gesture pill) at all, which is exactly why the TabBar sat underneath
    // it and was unreachable. react-native-safe-area-context's version
    // (needs SafeAreaProvider above it) handles both platforms correctly.
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="light-content" />
        {tab === "home" && <HomeScreen burrow={burrow} onNavigate={changeTab} onOpenChat={openChat} />}
        {tab === "messages" && (
          <MessagesScreen burrow={burrow} selectedPeerId={selectedPeerId} onSelectPeer={setSelectedPeerId} />
        )}
        {tab === "peers" && <PeersScreen burrow={burrow} localName={LOCAL_NAME} onOpenChat={openChat} />}
        {tab === "identity" && <IdentityScreen />}
        <TabBar active={tab} onChange={changeTab} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
});

export default App;
