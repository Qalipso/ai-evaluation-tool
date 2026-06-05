// Cinematic dark devtool palette. Electric-blue accent over near-black.
// Mirrors the real product's dark tokens, shifted brand purple -> electric blue.

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export const color = {
  // surfaces
  bgBase: "#06080f",
  bgPanel: "#0b0f1a",
  bgCard: "#11162400",
  bgCardSolid: "#111624",
  bgHover: "#161c2e",
  // borders
  border: "#1f2740",
  borderStrong: "#2c3656",
  hairline: "rgba(255,255,255,0.06)",
  // text
  text: "#e8ecf6",
  textSecondary: "#9aa4bf",
  textMuted: "#5c6680",
  // accent (electric blue)
  accent: "#3b82f6",
  accentBright: "#22d3ee",
  accentDeep: "#1d4ed8",
  accentGlow: "rgba(59,130,246,0.45)",
  accentSubtle: "rgba(59,130,246,0.12)",
  // status
  ok: "#3ecf8e",
  okSubtle: "rgba(62,207,142,0.12)",
  warn: "#f5a524",
  warnSubtle: "rgba(245,165,36,0.12)",
  bad: "#ef4444",
  badSubtle: "rgba(239,68,68,0.14)",
  badGlow: "rgba(239,68,68,0.45)",
} as const;

export const font = {
  sans: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
} as const;

// Scene durations (seconds) for the vertical slice.
export const SCENE = {
  hook: 8,
  liveRun: 13,
  judge: 15,
} as const;

export const sec = (s: number) => Math.round(s * FPS);
