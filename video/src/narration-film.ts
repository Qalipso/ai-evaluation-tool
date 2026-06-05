// VO lines for the 60s film. One per scene. TTS via scripts/tts-film.mjs.
// Captions derive from `text`; audio is gated behind the `audio` prop.

export type FilmScene =
  | "hook" | "problem" | "reveal" | "rubrics" | "claims" | "safety" | "verdict" | "cta";

export const filmNarration: Record<FilmScene, { text: string; audio: string }> = {
  hook: { text: "AI outputs can sound confident — even when they are wrong.", audio: "audio/film/hook.mp3" },
  problem: { text: "For real products, looking good is not enough.", audio: "audio/film/problem.mp3" },
  reveal: { text: "AI Evaluation Tool turns subjective reviews into measurable quality control.", audio: "audio/film/reveal.mp3" },
  rubrics: { text: "You define rubrics, thresholds, judges, and safety checks for every AI use case.", audio: "audio/film/rubrics.mp3" },
  claims: { text: "The claim pipeline breaks an answer into factual claims and checks them against retrieved evidence.", audio: "audio/film/claims.mp3" },
  safety: { text: "Safety gates catch the failures that should never reach production.", audio: "audio/film/safety.mp3" },
  verdict: { text: "Each run produces a verdict, score breakdown, rationale, and exportable report.", audio: "audio/film/verdict.mp3" },
  cta: { text: "Evaluate AI with evidence — not vibes.", audio: "audio/film/cta.mp3" },
};
