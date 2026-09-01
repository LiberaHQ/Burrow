type IconProps = { size?: number };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export function BluetoothIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M7 7l10 10-5 5V2l5 5L7 17" />
    </svg>
  );
}

/** The Burrow brand mark: a tunnel entrance with a small connected mesh inside it. */
export function BurrowLogo({ size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
      <rect width="1024" height="1024" rx="224" fill="#141416" />
      <path
        d="M 244 716 Q 244 316 512 316 Q 780 316 780 716"
        fill="none"
        stroke="#ea6a3c"
        strokeWidth="60"
        strokeLinecap="round"
      />
      <path d="M 176 716 L 848 716" stroke="#ea6a3c" strokeWidth="60" strokeLinecap="round" />
      <line x1="512" y1="486" x2="416" y2="606" stroke="#ea6a3c" strokeWidth="14" strokeLinecap="round" opacity="0.55" />
      <line x1="512" y1="486" x2="608" y2="606" stroke="#ea6a3c" strokeWidth="14" strokeLinecap="round" opacity="0.55" />
      <line x1="416" y1="606" x2="608" y2="606" stroke="#ea6a3c" strokeWidth="14" strokeLinecap="round" opacity="0.55" />
      <circle cx="512" cy="486" r="38" fill="#f6f3ee" />
      <circle cx="416" cy="606" r="30" fill="#f6f3ee" />
      <circle cx="608" cy="606" r="30" fill="#f6f3ee" />
    </svg>
  );
}

export function HomeIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

export function MessagesIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function ContactsIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M16.5 9a2.8 2.8 0 1 0 0-5.6" />
      <path d="M15 13.3c2.9.5 4.9 2.6 5.5 6.7" />
    </svg>
  );
}

export function IdentityIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="8" cy="8" r="4.5" />
      <path d="M11.2 11.2 21 21" />
      <path d="M16.5 15.5 19 13" />
      <path d="M19 18l2.5-2.5" />
    </svg>
  );
}

export function PeersIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18" />
      <path d="M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}

export function CopyIcon({ size = 14 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export function BroadcastIcon({ size = 16 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M12 12v9" />
      <path d="M8.5 8.5a5 5 0 0 0 0 7" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M5.5 5.5a9 9 0 0 0 0 13" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
