import React from "react";
import { AbsoluteFill, Audio, staticFile, useVideoConfig } from "remotion";
import { Backdrop } from "../../components/Backdrop";
import { Aurora } from "../../components/Aurora";
import { AssetBg } from "../../components/AssetBg";
import { Grain } from "../../components/Grain";
import { ScanLines, LightSweep, DepthBloom } from "../../components/Atmosphere";
import { Caption } from "../../components/Caption";
import { filmNarration, type FilmScene } from "../../narration-film";

// Toggle to bring generated backgrounds into the film once assets exist in
// public/video/generated/. Off by default so the film renders without them.
export const USE_GENERATED_ASSETS = true;

// Common scene chrome: backdrop glow, optional generated background (gated),
// narration audio (gated), lower-third caption, and the scene body.
export const FilmShell: React.FC<{
  scene: FilmScene;
  audio?: boolean;
  glow?: "accent" | "bad";
  pad?: string;
  bg?: string; // generated asset under public/, e.g. "video/generated/hero-board.png"
  bgVideo?: boolean;
  aurora?: boolean; // aurora-style animated gradient backdrop (title scenes)
  children: React.ReactNode;
}> = ({ scene, audio, glow = "accent", pad = "80px 150px 150px", bg, bgVideo, aurora, children }) => {
  const { durationInFrames } = useVideoConfig();
  const n = filmNarration[scene];
  return (
    <AbsoluteFill>
      {aurora ? <Aurora /> : <Backdrop glow={glow} />}
      {!aurora && <DepthBloom />}
      <AssetBg src={bg} video={bgVideo} enabled={USE_GENERATED_ASSETS && !!bg} />
      {audio && <Audio src={staticFile(n.audio)} />}
      <AbsoluteFill style={{ padding: pad }}>{children}</AbsoluteFill>
      <LightSweep />
      <ScanLines opacity={0.04} />
      <Grain opacity={0.045} />
      <Caption text={n.text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
