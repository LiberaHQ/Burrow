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

export function DownloadIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M4 19h16" />
    </svg>
  );
}

export function MonitorIcon({ size = 22 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M8 20h8" />
      <path d="M12 16v4" />
    </svg>
  );
}

export function SmartphoneIcon({ size = 22 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="6" y="2.5" width="12" height="19" rx="2" />
      <path d="M11 19h2" />
    </svg>
  );
}

export function CheckIcon({ size = 14 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={2.4}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export function BluetoothIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M7 7l10 10-5 5V2l5 5L7 17" />
    </svg>
  );
}
