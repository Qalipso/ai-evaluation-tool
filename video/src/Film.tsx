import React from "react";
import { AbsoluteFill, Series, useCurrentFrame, interpolate } from "remotion";
import { sec, color, FILM } from "./theme";
import { CameraPush } from "./components/CameraPush";
import { S1Hook } from "./scenes/film/S1Hook";
import { S2Problem } from "./scenes/film/S2Problem";
import { S3Reveal } from "./scenes/film/S3Reveal";
import { S4Rubrics } from "./scenes/film/S4Rubrics";
import { S5Claims } from "./scenes/film/S5Claims";
import { S6Safety } from "./scenes/film/S6Safety";
import { S7Verdict } from "./scenes/film/S7Verdict";
import { S8CTA } from "./scenes/film/S8CTA";

const Cut: React.FC<{ children: React.ReactNode; from?: number; to?: number; driftY?: number }> = ({ children, from = 1.0, to = 1.04, driftY = -8 }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 9], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      <CameraPush from={from} to={to} driftY={driftY}>
        {children}
      </CameraPush>
      <AbsoluteFill style={{ background: color.bgBase, opacity: interpolate(frame, [0, 7], [1, 0], { extrapolateRight: "clamp" }), pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

// Per-scene camera moves: title cards push in harder, dashboards drift gently.
const cam: Record<keyof typeof FILM, { from: number; to: number; driftY: number }> = {
  hook: { from: 1.0, to: 1.06, driftY: -6 },
  problem: { from: 1.02, to: 1.06, driftY: 4 },
  reveal: { from: 1.08, to: 1.0, driftY: 0 },
  rubrics: { from: 1.0, to: 1.04, driftY: -8 },
  claims: { from: 1.0, to: 1.035, driftY: -6 },
  safety: { from: 1.0, to: 1.04, driftY: -6 },
  verdict: { from: 1.0, to: 1.045, driftY: -8 },
  cta: { from: 1.06, to: 1.0, driftY: 0 },
};

export const Film: React.FC<{ audio?: boolean }> = ({ audio = false }) => {
  const scenes: [keyof typeof FILM, React.FC<{ audio?: boolean }>][] = [
    ["hook", S1Hook],
    ["problem", S2Problem],
    ["reveal", S3Reveal],
    ["rubrics", S4Rubrics],
    ["claims", S5Claims],
    ["safety", S6Safety],
    ["verdict", S7Verdict],
    ["cta", S8CTA],
  ];
  return (
    <AbsoluteFill style={{ background: color.bgBase }}>
      <Series>
        {scenes.map(([key, Comp]) => (
          <Series.Sequence key={key} durationInFrames={sec(FILM[key])}>
            <Cut {...cam[key]}>
              <Comp audio={audio} />
            </Cut>
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  );
};

export const FILM_FRAMES = (Object.values(FILM) as number[]).reduce((a, s) => a + sec(s), 0);
