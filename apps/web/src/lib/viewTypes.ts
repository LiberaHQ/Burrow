export type ViewId = "home" | "messages" | "identity" | "peers";

export interface NavItem {
  id: ViewId;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Home" },
  { id: "messages", label: "Messages" },
  { id: "identity", label: "Identity" },
  { id: "peers", label: "Peers" },
];
