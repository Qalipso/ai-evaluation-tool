# Video & motion assets

Motion assets used in the README and product preview. Source compositions live
in `video/` (Remotion). Regenerate GIFs with `cd video && npm run render:*`,
then export GIFs (see `video/README.md`).

## Assets

| Asset | Used in | Source comp | Notes |
|-------|---------|-------------|-------|
| `docs/assets/teaser15.gif` | README hero | `Teaser15` | ~13s montage: lie → claims → safety → verdict → slogan. Heavy (~6.5MB) — consider re-export at scale 0.4 if GitHub render is slow. |
| `docs/assets/teaser15.mp4` | Portfolio / social | `Teaser15` | Higher-quality MP4 of the teaser. |
| `docs/assets/ChartRubric.gif` | README · Rubric breakdown | `ChartRubric` | Score bars filling per dimension. |
| `docs/assets/ChartPipeline.gif` | README · Claim pipeline | `ChartPipeline` | Answer → Claims → Evidence → Score → Verdict flow. |
| `docs/assets/ChartGates.gif` | README · Safety gates | `ChartGates` | 2×3 gate grid, one BLOCKED. |
| `docs/assets/ChartScore.gif` | README · Verdict score | `ChartScore` | Dial 0 → 94, Ship-ready. |

## Visual language

- **Primary GitHub hero = dark technical evaluation cockpit** (violet accent,
  glass cards, score dials). Keep README on this.
- **Robots-café footage** (`video/public/video/generated/hook-robots.mp4`) is an
  optional hook asset for the film cold-open only — **not** a README hero.

## Full film

`EvalFilm` (~42s) is the long-form launch film with free audio (edge-tts VO +
ffmpeg music bed + SFX). Render: `cd video && npm run render`. Audio regen:
`bash video/scripts/gen-audio.sh`.

## Future polish (next round)

- Per-scene distinct styles (neumorph metrics, swiss rubrics, brutalist hook)
- Stronger foreground animations (claim→evidence connector lines, draw-on paths)
- Audio design pass (ducking, SFX on more beats, real VO take)
- Optional three.js real-3D (`@remotion/three`) for the verdict dial / chamber
- Audio-reactive variant (`@remotion/media-utils` `visualizeAudio`)
