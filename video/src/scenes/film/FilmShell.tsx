import React from "react";
import { AbsoluteFill, Audio, staticFile, useVideoConfig } from "remotion";
import { Backdrop } from "../../components/Backdrop";
import { AssetBg } from "../../components/AssetBg";
import { Caption } from "../../components/Caption";
import { filmNarration, type FilmScene } from "../../narration-film";

// Toggle to bring generated backgrounds into the film once assets exist in
// public/video/generated/. Off by default so the film renders without them.
export const USE_GENERATED_ASSETS = false;

// Common scene chrome: backdrop glow, optional generated background (gated),
// narration audio (gated), lower-third caption, and the scene body.
export const FilmShell: React.FC<{
  scene: FilmScene;
  audio?: boolean;
  glow?: "accent" | "bad";
  pad?: string;
  bg?: string; // generated asset under public/, e.g. "video/generated/hero-board.png"
  bgVideo?: boolean;
  children: React.ReactNode;
}> = ({ scene, audio, glow = "accent", pad = "80px 150px 150px", bg, bgVideo, children }) => {
  const { durationInFrames } = useVideoConfig();
  const n = filmNarration[scene];
  return (
    <AbsoluteFill>
      <Backdrop glow={glow} />
      <AssetBg src={bg} video={bgVideo} enabled={USE_GENERATED_ASSETS && !!bg} />
      {audio && <Audio src={staticFile(n.audio)} />}
      <AbsoluteFill style={{ padding: pad }}>{children}</AbsoluteFill>
      <Caption text={n.text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
