"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BurrowLogo } from "@/components/Icons";
import {
  SECTIONS,
  flattenNav,
  getBreadcrumbs,
  getPager,
  isGroup,
  type NavEntry,
  type NavGroup,
  type SectionKey,
} from "@/lib/docsNav";
import styles from "./DocLayout.module.css";

export interface TocItem {
  id: string;
  title: string;
  /** 2 = h2 (default), 3 = h3 (indented). */
  depth?: 2 | 3;
}

interface DocLayoutProps {
  section: SectionKey;
  /** The current route, must match an href in the section nav. */
  href: string;
  title: string;
  toc?: readonly TocItem[];
  children: React.ReactNode;
}

function ChevronIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function ArrowIcon({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ transform: dir === "left" ? "rotate(180deg)" : undefined }}>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.6v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .4.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5Z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const TOP_LINKS = [
  { title: "Home", href: "/" },
  { title: "Docs", href: "/docs" },
  { title: "Tutorials", href: "/tutorials" },
  { title: "Download", href: "/#download" },
];

const NO_TOC: readonly TocItem[] = [];

export function DocLayout({ section, href, title, toc = NO_TOC, children }: DocLayoutProps) {
  const pathname = usePathname();
  const { nav } = SECTIONS[section];

  const crumbs = useMemo(() => getBreadcrumbs(section, href), [section, href]);
  const pager = useMemo(() => getPager(section, href), [section, href]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(toc[0]?.id ?? null);

  // Stable key so the effect below only re-runs when the headings actually change.
  const tocKey = toc.map((t) => t.id).join("|");

  // Scroll-spy for the "On this page" list.
  useEffect(() => {
    const ids = tocKey ? tocKey.split("|") : [];
    if (ids.length === 0) return;
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el != null);
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "0px 0px -70% 0px", threshold: 0 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [tocKey]);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <button
            className={styles.menuButton}
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle navigation"
            aria-expanded={sidebarOpen}
          >
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link href="/" className={styles.brand}>
            <BurrowLogo size={26} />
            <span>BURROW</span>
          </Link>
          <nav className={styles.topLinks}>
            {TOP_LINKS.map((l) => {
              const active =
                l.href === "/docs"
                  ? pathname.startsWith("/docs")
                  : l.href === "/tutorials"
                    ? pathname.startsWith("/tutorials")
                    : pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={active ? styles.topLinkActive : styles.topLink}
                >
                  {l.title}
                </Link>
              );
            })}
          </nav>
          <div className={styles.iconLinks}>
            <a
              className={styles.iconLink}
              href="https://x.com/BurrowChat"
              target="_blank"
              rel="noreferrer"
              aria-label="Burrow on X"
            >
              <XIcon />
            </a>
            <a
              className={styles.iconLink}
              href="https://github.com/LiberaHQ/Burrow"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
            >
              <GitHubIcon />
            </a>
          </div>
        </div>
      </header>

      <div className={styles.body}>
        {sidebarOpen && <div className={styles.scrim} onClick={closeSidebar} />}
        <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
          <Sidebar nav={nav} currentHref={href} onNavigate={closeSidebar} />
        </aside>

        <main className={styles.main}>
          <article className={styles.article}>
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              {crumbs.map((c, i) => (
                <span key={c.href} className={styles.crumb}>
                  {i > 0 && <span className={styles.crumbSep}>/</span>}
                  {i === crumbs.length - 1 ? (
                    <span className={styles.crumbCurrent}>{c.title}</span>
                  ) : (
                    <Link href={c.href}>{c.title}</Link>
                  )}
                </span>
              ))}
            </nav>

            <h1 className={styles.title}>{title}</h1>

            <div className={styles.content}>{children}</div>

            {(pager.prev || pager.next) && (
              <nav className={styles.pager} aria-label="Docs pages">
                {pager.prev ? (
                  <Link href={pager.prev.href} className={`${styles.pagerLink} ${styles.pagerPrev}`}>
                    <span className={styles.pagerLabel}>
                      <ArrowIcon dir="left" /> Previous
                    </span>
                    <span className={styles.pagerTitle}>{pager.prev.title}</span>
                  </Link>
                ) : (
                  <span />
                )}
                {pager.next && (
                  <Link href={pager.next.href} className={`${styles.pagerLink} ${styles.pagerNext}`}>
                    <span className={styles.pagerLabel}>
                      Next <ArrowIcon dir="right" />
                    </span>
                    <span className={styles.pagerTitle}>{pager.next.title}</span>
                  </Link>
                )}
              </nav>
            )}
          </article>

          {toc.length > 0 && (
            <aside className={styles.toc} aria-label="On this page">
              <div className={styles.tocHeading}>On this page</div>
              <ul className={styles.tocList}>
                {toc.map((t) => (
                  <li key={t.id}>
                    <a
                      href={`#${t.id}`}
                      className={`${styles.tocLink} ${t.depth === 3 ? styles.tocSub : ""} ${
                        activeId === t.id ? styles.tocActive : ""
                      }`}
                    >
                      {t.title}
                    </a>
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </main>
      </div>

      <footer className={styles.footer}>
        <span>Burrow — built on Bluetooth LE, not the cloud.</span>
        <span className={styles.footerLinks}>
          <Link href="/docs">Docs</Link>
          <Link href="/tutorials">Tutorials</Link>
          <Link href="/#download">Download</Link>
          <a href="https://x.com/BurrowChat" target="_blank" rel="noreferrer">
            X
          </a>
        </span>
      </footer>
    </div>
  );
}

function Sidebar({
  nav,
  currentHref,
  onNavigate,
}: {
  nav: NavEntry[];
  currentHref: string;
  onNavigate: () => void;
}) {
  return (
    <nav className={styles.sidebarNav}>
      {nav.map((entry) =>
        isGroup(entry) ? (
          <SidebarGroup
            key={entry.title}
            entry={entry}
            currentHref={currentHref}
            onNavigate={onNavigate}
          />
        ) : (
          <Link
            key={entry.href}
            href={entry.href}
            onClick={onNavigate}
            className={`${styles.sideLink} ${currentHref === entry.href ? styles.sideLinkActive : ""}`}
          >
            {entry.title}
          </Link>
        ),
      )}
    </nav>
  );
}

function SidebarGroup({
  entry,
  currentHref,
  onNavigate,
}: {
  entry: NavGroup;
  currentHref: string;
  onNavigate: () => void;
}) {
  const containsCurrent =
    entry.href === currentHref || entry.items.some((it) => it.href === currentHref);

  // Follows the active route by default; a manual toggle takes over from then on.
  const [override, setOverride] = useState<boolean | null>(null);
  const open = override ?? containsCurrent;

  return (
    <div className={styles.group}>
      <div className={styles.groupHeader}>
        {entry.href ? (
          <Link
            href={entry.href}
            onClick={onNavigate}
            className={`${styles.groupTitle} ${currentHref === entry.href ? styles.sideLinkActive : ""}`}
          >
            {entry.title}
          </Link>
        ) : (
          <span className={styles.groupTitle}>{entry.title}</span>
        )}
        <button
          className={`${styles.groupToggle} ${open ? styles.groupToggleOpen : ""}`}
          onClick={() => setOverride(!open)}
          aria-label={open ? "Collapse section" : "Expand section"}
          aria-expanded={open}
        >
          <ChevronIcon />
        </button>
      </div>
      {open && (
        <div className={styles.groupItems}>
          {entry.items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              onClick={onNavigate}
              className={`${styles.sideLink} ${styles.sideSub} ${
                currentHref === it.href ? styles.sideLinkActive : ""
              }`}
            >
              {it.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Content building blocks — used inside the `children` of DocLayout.
// ---------------------------------------------------------------------------

/** Card grid for section landing pages ("Explore the docs"). */
export function CardGrid({ children }: { children: React.ReactNode }) {
  return <div className={styles.cardGrid}>{children}</div>;
}

export function DocCard({
  href,
  title,
  children,
}: {
  href: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={styles.card}>
      <span className={styles.cardTitle}>{title}</span>
      <span className={styles.cardBody}>{children}</span>
    </Link>
  );
}

/**
 * Auto-builds a card grid from a section's nav tree.
 * With `group` set to a group's href, shows only that group's child pages.
 */
export function SectionCards({ section, group }: { section: SectionKey; group?: string }) {
  const { base, nav } = SECTIONS[section];

  let pages;
  if (group) {
    const g = nav.find((e): e is NavGroup => isGroup(e) && e.href === group);
    pages = g ? g.items : [];
  } else {
    pages = flattenNav(nav).filter((p) => p.href !== base);
  }

  return (
    <CardGrid>
      {pages.map((p) => (
        <DocCard key={p.href} href={p.href} title={p.title}>
          {p.blurb ?? ""}
        </DocCard>
      ))}
    </CardGrid>
  );
}

export function Callout({
  type = "note",
  title,
  children,
}: {
  type?: "note" | "tip" | "warning";
  title?: string;
  children: React.ReactNode;
}) {
  const label = title ?? { note: "Note", tip: "Tip", warning: "Heads up" }[type];
  return (
    <div className={`${styles.callout} ${styles[`callout_${type}`]}`}>
      <div className={styles.calloutLabel}>{label}</div>
      <div className={styles.calloutBody}>{children}</div>
    </div>
  );
}

export function Steps({ children }: { children: React.ReactNode }) {
  return <ol className={styles.steps}>{children}</ol>;
}
