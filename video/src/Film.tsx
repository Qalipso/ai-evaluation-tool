import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { TransitionSeries, springTiming, linearTiming, type TransitionPresentation } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { fade } from "@remotion/transitions/fade";
import { flip } from "@remotion/transitions/flip";
import { sec, color, FILM } from "./theme";
import { CameraPush } from "./components/CameraPush";
import { S0ColdOpen } from "./scenes/film/S0ColdOpen";
import { S1Hook } from "./scenes/film/S1Hook";
import { S2Problem } from "./scenes/film/S2Problem";
import { S3Reveal } from "./scenes/film/S3Reveal";
import { S4Rubrics } from "./scenes/film/S4Rubrics";
import { S5Claims } from "./scenes/film/S5Claims";
import { S6Safety } from "./scenes/film/S6Safety";
import { S7Verdict } from "./scenes/film/S7Verdict";
import { S8CTA } from "./scenes/film/S8CTA";

// Slow cinematic dolly per scene (camera push) + punch-in on entry.
const Cut: React.FC<{ children: React.ReactNode; from: number; to: number; driftY: number }> = ({ children, from, to, driftY }) => {
  const frame = useCurrentFrame();
  const punch = interpolate(frame, [0, 6], [1.03, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ transform: `scale(${punch})` }}>
      <CameraPush from={from} to={to} driftY={driftY}>
        {children}
      </CameraPush>
    </AbsoluteFill>
  );
};

const cam: Record<keyof typeof FILM, { from: number; to: number; driftY: number }> = {
  coldOpen: { from: 1.12, to: 1.0, driftY: 0 }, // punch zoom-out grab
  hook: { from: 1.0, to: 1.06, driftY: -6 },
  problem: { from: 1.04, to: 1.1, driftY: 0 },
  reveal: { from: 1.08, to: 1.0, driftY: 0 },
  rubrics: { from: 1.0, to: 1.04, driftY: -8 },
  claims: { from: 1.0, to: 1.035, driftY: -6 },
  safety: { from: 1.0, to: 1.05, driftY: -6 },
  verdict: { from: 1.0, to: 1.045, driftY: -8 },
  cta: { from: 1.08, to: 1.0, driftY: 0 },
};

const Scenes: { key: keyof typeof FILM; Comp: React.FC<{ audio?: boolean }> }[] = [
  { key: "coldOpen", Comp: S0ColdOpen },
  { key: "hook", Comp: S1Hook },
  { key: "problem", Comp: S2Problem },
  { key: "reveal", Comp: S3Reveal },
  { key: "rubrics", Comp: S4Rubrics },
  { key: "claims", Comp: S5Claims },
  { key: "safety", Comp: S6Safety },
  { key: "verdict", Comp: S7Verdict },
  { key: "cta", Comp: S8CTA },
];

// Animated transitions between scenes — varied presentations, escalating speed
// (durations shrink toward the climax = rising tension / нагнетение).
/* eslint-disable @typescript-eslint/no-explicit-any */
const transitions: { dur: number; p: () => TransitionPresentation<any>; t: ReturnType<typeof linearTiming> }[] = [
  { dur: 8, p: () => fade(), t: linearTiming({ durationInFrames: 8 }) }, // coldOpen -> hook: fast hard cut
  { dur: 16, p: () => slide({ direction: "from-bottom" }), t: springTiming({ config: { damping: 200 } }) },
  { dur: 15, p: () => wipe({ direction: "from-left" }), t: linearTiming({ durationInFrames: 15 }) },
  { dur: 14, p: () => slide({ direction: "from-right" }), t: springTiming({ config: { damping: 200 } }) },
  { dur: 22, p: () => flip({ direction: "from-right", perspective: 1800 }), t: springTiming({ config: { damping: 14, mass: 0.8 }, durationInFrames: 22 }) },
  { dur: 11, p: () => wipe({ direction: "from-bottom" }), t: linearTiming({ durationInFrames: 11 }) },
  { dur: 10, p: () => flip(), t: springTiming({ config: { damping: 200 } }) },
  { dur: 12, p: () => fade(), t: linearTiming({ durationInFrames: 12 }) },
];

export const Film: React.FC<{ audio?: boolean }> = ({ audio = false }) => {
  return (
    <AbsoluteFill style={{ background: color.bgBase }}>
      <TransitionSeries>
        {Scenes.map(({ key, Comp }, i) => (
          <React.Fragment key={key}>
            <TransitionSeries.Sequence durationInFrames={sec(FILM[key])}>
              <Cut {...cam[key]}>
                <Comp audio={audio} />
              </Cut>
            </TransitionSeries.Sequence>
            {i < transitions.length && (
              <TransitionSeries.Transition presentation={transitions[i].p()} timing={transitions[i].t} />
            )}
          </React.Fragment>
        ))}
      </TransitionSeries>
    </AbsoluteFill>
  );
};

const SCENE_FRAMES = (Object.values(FILM) as number[]).reduce((a, s) => a + sec(s), 0);
const TRANSITION_FRAMES = transitions.reduce((a, t) => a + t.dur, 0);
export const FILM_FRAMES = SCENE_FRAMES - TRANSITION_FRAMES;
