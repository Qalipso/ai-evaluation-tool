// Cinematic dark devtool palette. Soft-violet accent over near-black,
// matching the real product's dark brand (#7c6cff). Green success, amber
// warn, muted red danger — "security cockpit" mood.

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export const color = {
  // surfaces
  bgBase: "#07070d",
  bgPanel: "#0c0c16",
  bgCard: "#14141f00",
  bgCardSolid: "#14141f",
  bgHover: "#191928",
  // borders
  border: "#23233a",
  borderStrong: "#312f52",
  hairline: "rgba(255,255,255,0.06)",
  // text
  text: "#e9e7f4",
  textSecondary: "#a3a0bd",
  textMuted: "#6b6788",
  // accent (soft violet)
  accent: "#7c6cff",
  accentBright: "#a78bfa",
  accentDeep: "#5b46d6",
  accentGlow: "rgba(124,108,255,0.45)",
  accentSubtle: "rgba(124,108,255,0.12)",
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

// Full 60s film — 8 scenes. "Evaluate AI with evidence, not vibes."
// Exact storyboard timing @30fps: 5+5+6+8+12+9+9+6 = 60s.
export const FILM = {
  hook: 5,
  problem: 5,
  reveal: 6,
  rubrics: 8,
  claims: 12,
  safety: 9,
  verdict: 9,
  cta: 6,
} as const;

export const FILM_ORDER = ["hook", "problem", "reveal", "rubrics", "claims", "safety", "verdict", "cta"] as const;

export const sec = (s: number) => Math.round(s * FPS);
