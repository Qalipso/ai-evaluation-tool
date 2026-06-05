# AI Evaluation Tool — Cinematic Product Video (Remotion)

Dark devtool / "testing cockpit" product film. Positioning:

> **AI works in demos. Evaluation shows what happens under pressure.**

Built with [Remotion](https://remotion.dev) 4. 1920×1080 @ 30fps. Electric-blue
accent over near-black, mirroring the product's dark theme.

## Status — vertical slice

Three hero scenes (~36s) locked:

| Scene | Beat |
|-------|------|
| `Hook` | Polished agent answers perfectly → glitch → `Policy violation detected` → thesis |
| `LiveRun` | WhatsApp booking agent (ES) under test: tool call, access-control refusal, live decision trace → PASS |
| `Judge` | Score dial 0→82, 6-dim rubric breakdown, pass/fail evidence, typed judge rationale |

Remaining scenes from the full storyboard (Product reveal, Scenario builder,
Safety gates, Report, Final CTA) are not built yet.

## Run

```bash
npm install
npm run dev                 # Remotion Studio (preview/scrub all comps)
npm run render:slice        # out/ai-eval-slice.mp4 (silent + captions)
```

Per-scene comps (`Hook` / `LiveRun` / `Judge`) registered for fast iteration.

## Narration (TTS)

VO is gated behind the `audio` prop (default off → renders silent with
on-screen captions as the fallback layer). To add ElevenLabs narration:

```bash
export FAL_KEY=fal_xxx
node scripts/tts.mjs        # writes public/audio/{hook,live-run,judge}.mp3
npx remotion render EvalReel out/ai-eval-reel.mp4 --props='{"audio":true}'
```

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
