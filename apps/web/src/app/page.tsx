"use client";

import { useEffect, useState } from "react";
import { useBurrow } from "@/hooks/useBurrow";
import { api, type OwnIdentity } from "@/lib/api";
import type { ViewId } from "@/lib/viewTypes";
import { Sidebar } from "@/components/Sidebar";
import { HomeView } from "@/components/HomeView";
import { MessagesView } from "@/components/MessagesView";
import { PeersView } from "@/components/PeersView";
import { IdentityView } from "@/components/IdentityView";
import { BluetoothIcon } from "@/components/Icons";
import styles from "./page.module.css";

export default function Home() {
  const rs = useBurrow();
  const [view, setView] = useState<ViewId>("home");
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null);
  const [identity, setIdentity] = useState<OwnIdentity | null>(null);

  useEffect(() => {
    api
      .getIdentity()
      .then(setIdentity)
      .catch((err) => console.warn("[burrow] failed to load own identity:", err));
  }, [rs.wsConnected]);

  useEffect(() => {
    if (view === "messages") rs.markMessagesRead();
  }, [view, rs.markMessagesRead]);

  const openChat = (peerId: string) => {
    setSelectedPeerId(peerId);
    setView("messages");
  };

  return (
    <div className={styles.shell}>
      <Sidebar active={view} onNavigate={setView} identity={identity} unreadCount={rs.unreadCount} />

      <div className={styles.main}>
        <div className={styles.topBar}>
          <span
            className={
              !rs.wsConnected ? styles.statusOff : rs.adapterState === "poweredOn" ? styles.statusOk : styles.statusWarn
            }
            title={rs.wsConnected ? `server connected · bt: ${rs.adapterState}` : "server offline"}
          >
            <BluetoothIcon size={15} />
          </span>
        </div>

        {view === "home" && <HomeView rs={rs} onNavigate={setView} onOpenChat={openChat} />}
        {view === "messages" && <MessagesView rs={rs} selectedId={selectedPeerId} onSelect={setSelectedPeerId} />}
        {view === "peers" && <PeersView rs={rs} onOpenChat={openChat} />}
        {view === "identity" && <IdentityView identity={identity} />}
      </div>
    </div>
  );
}
