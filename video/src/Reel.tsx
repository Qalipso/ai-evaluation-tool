import React from "react";
import { AbsoluteFill, Series, useCurrentFrame, interpolate } from "remotion";
import { sec, color, SCENE } from "./theme";
import { HookScene } from "./scenes/HookScene";
import { LiveRunScene } from "./scenes/LiveRunScene";
import { JudgeScene } from "./scenes/JudgeScene";

// Brief black dip between scenes to sell the hard cut.
const SceneShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      {children}
      <AbsoluteFill style={{ background: color.bgBase, opacity: interpolate(frame, [0, 8], [1, 0], { extrapolateRight: "clamp" }), pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

export const Reel: React.FC<{ audio?: boolean }> = ({ audio = false }) => {
  return (
    <AbsoluteFill style={{ background: color.bgBase }}>
      <Series>
        <Series.Sequence durationInFrames={sec(SCENE.hook)}>
          <SceneShell>
            <HookScene audio={audio} />
          </SceneShell>
        </Series.Sequence>
        <Series.Sequence durationInFrames={sec(SCENE.liveRun)}>
          <SceneShell>
            <LiveRunScene audio={audio} />
          </SceneShell>
        </Series.Sequence>
        <Series.Sequence durationInFrames={sec(SCENE.judge)}>
          <SceneShell>
            <JudgeScene audio={audio} />
          </SceneShell>
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};

export const REEL_FRAMES = sec(SCENE.hook + SCENE.liveRun + SCENE.judge);
