// Sidebar / navigation trees for the /docs and /tutorials sections.
//
// One flat source of truth per section. The sidebar, breadcrumbs, and the
// prev/next pager are all derived from these arrays, so adding a page is a
// one-line change here plus the route file.

export interface NavLeaf {
  title: string;
  href: string;
  /** Short blurb shown on the section landing page cards. */
  blurb?: string;
}

export interface NavGroup {
  title: string;
  /** Optional landing route for the group itself (the category index). */
  href?: string;
  blurb?: string;
  items: NavLeaf[];
}

export type NavEntry = NavLeaf | NavGroup;

export function isGroup(entry: NavEntry): entry is NavGroup {
  return "items" in entry;
}

export interface DocSection {
  /** URL prefix, e.g. "/docs". */
  base: string;
  /** Label shown in the top nav and breadcrumb root. */
  label: string;
  nav: NavEntry[];
}

// ---------------------------------------------------------------------------
// /docs
// ---------------------------------------------------------------------------

const docsNav: NavEntry[] = [
  {
    title: "What is Burrow?",
    href: "/docs",
    blurb:
      "Why Burrow exists, what the Bluetooth LE mesh does, and how it differs from the apps you already use.",
  },
  {
    title: "Getting Started",
    href: "/docs/getting-started",
    blurb: "Install Burrow, pair a peer, and send your first message.",
    items: [
      {
        title: "Install",
        href: "/docs/getting-started/install",
        blurb: "Desktop and mobile builds, and what to expect on first launch.",
      },
      {
        title: "Your first session",
        href: "/docs/getting-started/first-session",
        blurb: "Open the app, find a nearby peer, and exchange a message.",
      },
    ],
  },
  {
    title: "Using Burrow",
    href: "/docs/using-burrow",
    blurb: "Day-to-day guides for messaging, peers, and settings.",
    items: [
      {
        title: "Messaging & peers",
        href: "/docs/using-burrow/messaging",
        blurb: "Conversations, delivery states, and how peers are identified.",
      },
      {
        title: "Settings",
        href: "/docs/using-burrow/settings",
        blurb: "Display name, identity keys, storage, and Bluetooth options.",
      },
    ],
  },
  {
    title: "Concepts",
    href: "/docs/concepts",
    blurb: "How the mesh, relaying, and encryption actually work.",
    items: [
      {
        title: "How the mesh works",
        href: "/docs/concepts/mesh",
        blurb: "Scanning, advertising, and multi-hop relay between nearby devices.",
      },
      {
        title: "Encryption",
        href: "/docs/concepts/encryption",
        blurb: "Identity keypairs, end-to-end encryption, and what metadata is visible.",
      },
    ],
  },
  {
    title: "Networking",
    href: "/docs/networking",
    blurb: "Bluetooth LE roles, range, and interference in practice.",
  },
  {
    title: "Hardware",
    href: "/docs/hardware",
    blurb: "Supported platforms, radios, and range planning.",
  },
  {
    title: "Reference",
    href: "/docs/reference",
    blurb: "Build instructions, storage layout, and troubleshooting.",
  },
];

// ---------------------------------------------------------------------------
// /tutorials
// ---------------------------------------------------------------------------

const tutorialsNav: NavEntry[] = [
  {
    title: "Welcome",
    href: "/tutorials",
    blurb: "What the tutorial portal covers and how the guides are ordered.",
  },
  {
    title: "Pairing your first device",
    href: "/tutorials/pairing",
    blurb: "Get two devices talking over Bluetooth LE with nothing else configured.",
    items: [
      {
        title: "iOS + Android",
        href: "/tutorials/pairing/ios-android",
        blurb: "Cross-platform pairing, permissions, and the first handshake.",
      },
    ],
  },
  {
    title: "Building a room mesh",
    href: "/tutorials/room-mesh",
    blurb: "Connect a handful of devices in one space into a single group.",
  },
  {
    title: "Relaying across floors",
    href: "/tutorials/relaying",
    blurb: "Use intermediate devices to carry messages past Bluetooth range limits.",
  },
  {
    title: "Bridging two buildings",
    href: "/tutorials/bridging",
    blurb: "Place relay nodes to join two separate clusters into one mesh.",
  },
];

// ---------------------------------------------------------------------------
// Sections + derived helpers
// ---------------------------------------------------------------------------

export const SECTIONS: Record<"docs" | "tutorials", DocSection> = {
  docs: { base: "/docs", label: "Docs", nav: docsNav },
  tutorials: { base: "/tutorials", label: "Tutorials", nav: tutorialsNav },
};

export type SectionKey = keyof typeof SECTIONS;

/** All pages in a section, in sidebar order — group index first, then its children. */
export function flattenNav(nav: NavEntry[]): NavLeaf[] {
  const out: NavLeaf[] = [];
  for (const entry of nav) {
    if (isGroup(entry)) {
      if (entry.href) out.push({ title: entry.title, href: entry.href, blurb: entry.blurb });
      out.push(...entry.items);
    } else {
      out.push(entry);
    }
  }
  return out;
}

export interface Pager {
  prev: NavLeaf | null;
  next: NavLeaf | null;
}

export function getPager(section: SectionKey, href: string): Pager {
  const flat = flattenNav(SECTIONS[section].nav);
  const i = flat.findIndex((p) => p.href === href);
  if (i === -1) return { prev: null, next: null };
  return {
    prev: i > 0 ? flat[i - 1] : null,
    next: i < flat.length - 1 ? flat[i + 1] : null,
  };
}

export interface Crumb {
  title: string;
  href: string;
}

/** Root crumb + the group (if any) + current page. */
export function getBreadcrumbs(section: SectionKey, href: string): Crumb[] {
  const { base, label, nav } = SECTIONS[section];
  const crumbs: Crumb[] = [{ title: label, href: base }];

  for (const entry of nav) {
    if (isGroup(entry)) {
      if (entry.href === href) {
        crumbs.push({ title: entry.title, href: entry.href });
        return crumbs;
      }
      const child = entry.items.find((it) => it.href === href);
      if (child) {
        if (entry.href) crumbs.push({ title: entry.title, href: entry.href });
        else crumbs.push({ title: entry.title, href: child.href });
        crumbs.push({ title: child.title, href: child.href });
        return crumbs;
      }
    } else if (entry.href === href && href !== base) {
      crumbs.push({ title: entry.title, href: entry.href });
      return crumbs;
    }
  }
  return crumbs;
}
