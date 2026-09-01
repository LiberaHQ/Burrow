import React from "react";
import Svg, { Path, Rect, Circle, Line } from "react-native-svg";

/** Same visual language as the desktop app's Icons.tsx (stroke-based line
 *  icons) — kept in sync by hand since the two apps don't share a component. */

type IconProps = { size?: number; color?: string };

export function HomeIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 11l9-8 9 8" />
      <Path d="M5 10v10h14V10" />
    </Svg>
  );
}

export function MessagesIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </Svg>
  );
}

export function PeersIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="9" />
      <Circle cx="12" cy="12" r="3.2" />
    </Svg>
  );
}

export function IdentityIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 2l8 4v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6z" />
    </Svg>
  );
}

export function BluetoothIcon({ size = 18, color = "currentColor" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M7 7l10 10-5 5V2l5 5L7 17" />
    </Svg>
  );
}

/** The Burrow brand mark — same artwork as the desktop app's BurrowLogo. */
export function BurrowLogo({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024">
      <Rect width="1024" height="1024" rx="224" fill="#141416" />
      <Path
        d="M 244 716 Q 244 316 512 316 Q 780 316 780 716"
        fill="none"
        stroke="#ea6a3c"
        strokeWidth="60"
        strokeLinecap="round"
      />
      <Line x1="176" y1="716" x2="848" y2="716" stroke="#ea6a3c" strokeWidth="60" strokeLinecap="round" />
      <Line x1="512" y1="486" x2="416" y2="606" stroke="#ea6a3c" strokeWidth="14" strokeLinecap="round" opacity={0.55} />
      <Line x1="512" y1="486" x2="608" y2="606" stroke="#ea6a3c" strokeWidth="14" strokeLinecap="round" opacity={0.55} />
      <Line x1="416" y1="606" x2="608" y2="606" stroke="#ea6a3c" strokeWidth="14" strokeLinecap="round" opacity={0.55} />
      <Circle cx="512" cy="486" r="38" fill="#f6f3ee" />
      <Circle cx="416" cy="606" r="30" fill="#f6f3ee" />
      <Circle cx="608" cy="606" r="30" fill="#f6f3ee" />
    </Svg>
  );
}
