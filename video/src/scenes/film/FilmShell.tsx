import React from "react";
import { AbsoluteFill, Audio, staticFile, useVideoConfig } from "remotion";
import { Backdrop } from "../../components/Backdrop";
import { Caption } from "../../components/Caption";
import { filmNarration, type FilmScene } from "../../narration-film";

// Common scene chrome: backdrop glow, narration audio (gated), lower-third
// caption tied to scene length, and the scene body.
export const FilmShell: React.FC<{
  scene: FilmScene;
  audio?: boolean;
  glow?: "accent" | "bad";
  pad?: string;
  children: React.ReactNode;
}> = ({ scene, audio, glow = "accent", pad = "80px 150px 150px", children }) => {
  const { durationInFrames } = useVideoConfig();
  const n = filmNarration[scene];
  return (
    <AbsoluteFill>
      <Backdrop glow={glow} />
      {audio && <Audio src={staticFile(n.audio)} />}
      <AbsoluteFill style={{ padding: pad }}>{children}</AbsoluteFill>
      <Caption text={n.text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
