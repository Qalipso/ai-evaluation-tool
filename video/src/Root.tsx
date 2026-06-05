import React from "react";
import { Composition } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { Reel, REEL_FRAMES } from "./Reel";
import { HookScene } from "./scenes/HookScene";
import { LiveRunScene } from "./scenes/LiveRunScene";
import { JudgeScene } from "./scenes/JudgeScene";
import { FPS, WIDTH, HEIGHT, sec, SCENE } from "./theme";

loadInter("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"], ignoreTooManyRequestsWarning: true });
loadMono("normal", { weights: ["400", "500", "600"], subsets: ["latin"], ignoreTooManyRequestsWarning: true });

export const RemotionRoot: React.FC = () => {
  const base = { fps: FPS, width: WIDTH, height: HEIGHT } as const;
  return (
    <>
      <Composition
        id="EvalReel"
        component={Reel}
        durationInFrames={REEL_FRAMES}
        defaultProps={{ audio: false }}
        {...base}
      />
      {/* Per-scene comps for fast iteration */}
      <Composition id="Hook" component={HookScene} durationInFrames={sec(SCENE.hook)} defaultProps={{ audio: false }} {...base} />
      <Composition id="LiveRun" component={LiveRunScene} durationInFrames={sec(SCENE.liveRun)} defaultProps={{ audio: false }} {...base} />
      <Composition id="Judge" component={JudgeScene} durationInFrames={sec(SCENE.judge)} defaultProps={{ audio: false }} {...base} />
    </>
  );
};
