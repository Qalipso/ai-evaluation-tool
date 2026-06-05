# AI Evaluation Tool — Cinematic Product Video (Remotion)

Dark devtool / "security cockpit" product film. Positioning:

> **Evaluate AI with evidence, not vibes.**

Built with [Remotion](https://remotion.dev) 4. 1920×1080 @ 30fps. Soft-violet
accent over near-black, matching the product's dark brand (`#7c6cff`).

## Main cut — `EvalFilm` (60s, 8 scenes)

Demo case: **AreaMosa** — a Spanish WhatsApp booking assistant.

| # | Scene | Beat |
|---|-------|------|
| 1 | Hook | Confident agent reply; one claim flagged `Unsupported claim` |
| 2 | Problem | Three failure alerts — "Confidence is not quality." |
| 3 | Reveal | Product name + tagline |
| 4 | Rubrics | 7 evaluation dimensions calibrate in |
| 5 | Claims | **Hero** — answer split into claims, checked vs evidence panel |
| 6 | Safety | 6-gate grid resolves; one `BLOCKED` |
| 7 | Verdict | Re-run → `Ship-ready` 0.94, KPIs, score bars |
| 8 | CTA | "Evaluate AI with evidence, not vibes." |

Also kept: `EvalReel` — the earlier 3-scene electric-blue slice (Hook/LiveRun/Judge).

## Run

```bash
npm install
npm run dev                 # Remotion Studio (preview/scrub all comps)
npm run render:film         # out/ai-eval-film.mp4 (silent + captions, 60s)
npm run render:slice        # out/ai-eval-slice.mp4 (3-scene slice, 36s)
```

Per-scene comps registered: `F1Hook`…`F8CTA` (film) and `Hook`/`LiveRun`/`Judge` (slice).

## Narration (TTS)

VO is gated behind the `audio` prop (default off → renders silent with
on-screen captions as the fallback layer). To add ElevenLabs narration
(needs a **funded** `FAL_KEY` — fal.ai/dashboard/billing):

```bash
export FAL_KEY=fal_xxx
node scripts/tts-film.mjs   # writes public/audio/film/*.mp3 (8 lines)
npx remotion render EvalFilm out/ai-eval-film.mp4 --props='{"audio":true}'
```

(`scripts/tts.mjs` does the same for the 3-scene slice.)

Voice: ElevenLabs Turbo v2.5, "Brian". Lines live in `src/narration.ts`
(single source for captions + TTS).

## Layout

```
src/
  Root.tsx          compositions + font loading
  Reel.tsx          Series sequence of the 3 scenes (black-dip cuts)
  theme.ts          palette, fps/size, scene durations
  data.ts           authentic mock eval data (Case/Score/Rubric shapes)
  narration.ts      VO lines + audio paths
  scenes/           HookScene, LiveRunScene, JudgeScene
  components/        ProductFrame, ChatSimulation, TraceTimeline,
                     ScoreDial, RubricBars, Caption, GlitchOverlay,
                     Backdrop, anim helpers
scripts/tts.mjs     fal.ai narration generator
```

Mock data shapes mirror the real product (`app/src/lib/data.ts`) so the film
reads as the actual tool, not a generic dashboard.
