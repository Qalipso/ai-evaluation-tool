import React from "react";
import { Composition } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { Reel, REEL_FRAMES } from "./Reel";
import { Film, FILM_FRAMES } from "./Film";
import { Teaser, TEASER_FRAMES } from "./Teaser";
import { ChartPipeline, ChartGates, ChartRubric, ChartScore } from "./Charts";
import { HookScene } from "./scenes/HookScene";
import { LiveRunScene } from "./scenes/LiveRunScene";
import { JudgeScene } from "./scenes/JudgeScene";
import { S1Hook } from "./scenes/film/S1Hook";
import { S2Problem } from "./scenes/film/S2Problem";
import { S3Reveal } from "./scenes/film/S3Reveal";
import { S4Rubrics } from "./scenes/film/S4Rubrics";
import { S5Claims } from "./scenes/film/S5Claims";
import { S6Safety } from "./scenes/film/S6Safety";
import { S7Verdict } from "./scenes/film/S7Verdict";
import { S8CTA } from "./scenes/film/S8CTA";
import { FPS, WIDTH, HEIGHT, sec, SCENE, FILM } from "./theme";

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
      {/* Full 60s film */}
      <Composition id="EvalFilm" component={Film} durationInFrames={FILM_FRAMES} defaultProps={{ audio: true }} {...base} />
      {/* 15s teaser for README / quick demo */}
      <Composition id="Teaser15" component={Teaser} durationInFrames={TEASER_FRAMES} {...base} />
      {/* Standalone animated charts (README loops, 16:9 720p) */}
      <Composition id="ChartPipeline" component={ChartPipeline} durationInFrames={sec(4)} fps={FPS} width={1280} height={720} />
      <Composition id="ChartGates" component={ChartGates} durationInFrames={sec(5)} fps={FPS} width={1280} height={720} />
      <Composition id="ChartRubric" component={ChartRubric} durationInFrames={sec(4)} fps={FPS} width={1280} height={720} />
      <Composition id="ChartScore" component={ChartScore} durationInFrames={sec(3)} fps={FPS} width={1280} height={720} />
      {/* Film per-scene comps */}
      <Composition id="F1Hook" component={S1Hook} durationInFrames={sec(FILM.hook)} defaultProps={{ audio: false }} {...base} />
      <Composition id="F2Problem" component={S2Problem} durationInFrames={sec(FILM.problem)} defaultProps={{ audio: false }} {...base} />
      <Composition id="F3Reveal" component={S3Reveal} durationInFrames={sec(FILM.reveal)} defaultProps={{ audio: false }} {...base} />
      <Composition id="F4Rubrics" component={S4Rubrics} durationInFrames={sec(FILM.rubrics)} defaultProps={{ audio: false }} {...base} />
      <Composition id="F5Claims" component={S5Claims} durationInFrames={sec(FILM.claims)} defaultProps={{ audio: false }} {...base} />
      <Composition id="F6Safety" component={S6Safety} durationInFrames={sec(FILM.safety)} defaultProps={{ audio: false }} {...base} />
      <Composition id="F7Verdict" component={S7Verdict} durationInFrames={sec(FILM.verdict)} defaultProps={{ audio: false }} {...base} />
      <Composition id="F8CTA" component={S8CTA} durationInFrames={sec(FILM.cta)} defaultProps={{ audio: false }} {...base} />
      {/* Vertical slice (electric-blue era kept for reference) */}
      <Composition id="Hook" component={HookScene} durationInFrames={sec(SCENE.hook)} defaultProps={{ audio: false }} {...base} />
      <Composition id="LiveRun" component={LiveRunScene} durationInFrames={sec(SCENE.liveRun)} defaultProps={{ audio: false }} {...base} />
      <Composition id="Judge" component={JudgeScene} durationInFrames={sec(SCENE.judge)} defaultProps={{ audio: false }} {...base} />
    </>
  );
};
