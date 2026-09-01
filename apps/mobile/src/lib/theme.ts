/**
 * Same design tokens as the desktop app's apps/web/src/app/globals.css
 * (:root custom properties) — kept in sync by hand since React Native has
 * no CSS custom properties to share directly. Update both together.
 */
export const theme = {
  background: "#0a0a0b",
  foreground: "#f2f2f3",
  cardBg: "#17171a",
  cardBgRaised: "#1c1c20",
  border: "#26262a",
  borderStrong: "#34343a",
  textSecondary: "#9a9aa2",
  textTertiary: "#6b6b72",
  accent: "#ea6a3c",
  accentDim: "rgba(234, 106, 60, 0.14)",
  /** Text color on top of an accent-colored surface (e.g. the outgoing chat bubble). */
  onAccent: "#1a0f08",
  danger: "#450a0a",
  dangerText: "#fecaca",
} as const;

/**
 * Cross-platform elevation presets. iOS reads shadowColor/Offset/Opacity/
 * Radius; Android only honors the single `elevation` number and synthesizes
 * its own shadow from it — both are included on every preset so one style
 * object looks right on both.
 */
export const shadow = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.32,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  accent: {
    shadowColor: theme.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;
