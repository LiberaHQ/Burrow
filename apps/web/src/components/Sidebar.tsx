"use client";

import type { OwnIdentity } from "@/lib/api";
import { NAV_ITEMS, type ViewId } from "@/lib/viewTypes";
import styles from "./Sidebar.module.css";
import { BurrowLogo, HomeIcon, IdentityIcon, MessagesIcon, PeersIcon } from "./Icons";

const ICONS: Record<ViewId, React.ComponentType<{ size?: number }>> = {
  home: HomeIcon,
  messages: MessagesIcon,
  identity: IdentityIcon,
  peers: PeersIcon,
};

export function Sidebar({
  active,
  onNavigate,
  identity,
  unreadCount = 0,
}: {
  active: ViewId;
  onNavigate: (view: ViewId) => void;
  identity: OwnIdentity | null;
  unreadCount?: number;
}) {
  return (
    <nav className={styles.sidebar}>
      <div className={styles.brand}>
        <BurrowLogo size={28} />
        <span className={styles.brandName}>BURROW</span>
      </div>
      <hr className={styles.divider} />
      <ul className={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.id];
          const badge = item.id === "messages" && unreadCount > 0;
          return (
            <li key={item.id}>
              <button
                className={item.id === active ? styles.navButtonActive : styles.navButton}
                onClick={() => onNavigate(item.id)}
              >
                <span className={styles.iconSlot}>
                  <Icon />
                  {badge && (
                    <span className={styles.badge}>{unreadCount > 99 ? "99+" : unreadCount}</span>
                  )}
                </span>
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
      <div className={styles.identityCard} onClick={() => onNavigate("identity")} role="button">
        <div className={styles.avatar} />
        <div className={styles.identityText}>
          <div className={styles.identityName}>{identity ? "This device" : "Loading…"}</div>
          <div className={styles.identityHash}>
            {identity ? `${identity.hash.slice(0, 8)}…${identity.hash.slice(-4)}` : ""}
          </div>
        </div>
      </div>
    </nav>
  );
}
