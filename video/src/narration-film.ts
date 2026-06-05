// VO lines for the 60s film. One per scene. TTS via scripts/tts-film.mjs.
// Captions derive from `text`; audio is gated behind the `audio` prop.

export type FilmScene =
  | "hook" | "problem" | "reveal" | "rubrics" | "claims" | "safety" | "verdict" | "cta";

// v3 "trial" script — more brand-forward and dramatic. One line per scene.
export const filmNarration: Record<FilmScene, { text: string; audio: string }> = {
  hook: { text: "AI can lie beautifully.", audio: "audio/film/hook.mp3" },
  problem: { text: "A fluent answer can hide a false claim, a broken policy, or a risky action.", audio: "audio/film/problem.mp3" },
  reveal: { text: "AI Evaluation Tool gives every output a quality trial.", audio: "audio/film/reveal.mp3" },
  rubrics: { text: "Rubrics define the rules.", audio: "audio/film/rubrics.mp3" },
  claims: { text: "Evidence checks the claims.", audio: "audio/film/claims.mp3" },
  safety: { text: "Safety gates block the risks.", audio: "audio/film/safety.mp3" },
  verdict: { text: "And every run ends with a verdict your team can trust.", audio: "audio/film/verdict.mp3" },
  cta: { text: "Evaluate AI with evidence — not vibes.", audio: "audio/film/cta.mp3" },
};
