import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, staticFile } from "remotion";
import { color } from "../theme";

// Optional cinematic background from a generated asset (image or mp4). Gated:
// renders nothing unless `enabled` is true AND a src is given, so the film
// renders cleanly before any assets exist in public/video/generated/.
// When enabled, the asset sits behind the UI at low opacity with a dark
// gradient scrim so Remotion-rendered text stays legible.
export const AssetBg: React.FC<{
  src?: string; // path under public/, e.g. "video/generated/hero-board.png"
  enabled?: boolean;
  opacity?: number;
  video?: boolean;
}> = ({ src, enabled = false, opacity = 0.28, video = false }) => {
  if (!enabled || !src) return null;
  const file = staticFile(src);
  return (
    <AbsoluteFill>
      {video ? (
        <OffthreadVideo src={file} muted playbackRate={0.7} style={{ width: "100%", height: "100%", objectFit: "cover", opacity }} />
      ) : (
        <Img src={file} style={{ width: "100%", height: "100%", objectFit: "cover", opacity }} />
      )}
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${color.bgBase}cc, ${color.bgBase}ee)` }} />
    </AbsoluteFill>
  );
};
