// One source of truth for VO lines. Each scene owns its narration text +
// the audio file rendered by scripts/tts.mjs. Captions derive from `text`.

export type Narration = {
  scene: "hook" | "liveRun" | "judge";
  text: string;
  audio: string; // path under public/audio (staticFile)
};

export const narration: Record<Narration["scene"], Narration> = {
  hook: {
    scene: "hook",
    text: "AI agents often look perfect in happy-path demos. But real users don't follow the script.",
    audio: "audio/hook.mp3",
  },
  liveRun: {
    scene: "liveRun",
    text: "The system runs the agent against controlled but realistic conversations, tool calls, and edge cases.",
    audio: "audio/live-run.mp3",
  },
  judge: {
    scene: "judge",
    text: "Every result includes a score, a rubric breakdown, and a judge rationale — so failures become actionable.",
    audio: "audio/judge.mp3",
  },
};
