import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, random } from "remotion";
import { color } from "../theme";

// Short RGB-split + scanline burst. Fires over [start, start+dur] to mark the
// moment a happy-path demo "breaks".
export const GlitchOverlay: React.FC<{ start: number; dur?: number }> = ({ start, dur = 9 }) => {
  const frame = useCurrentFrame();
  if (frame < start || frame > start + dur) return null;
  const t = (frame - start) / dur;
  const intensity = interpolate(t, [0, 0.5, 1], [0, 1, 0]);
  const jx = (random(`glitch-${frame}`) - 0.5) * 22 * intensity;

  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen" }}>
      <AbsoluteFill style={{ background: color.bad, opacity: 0.06 * intensity }} />
      <AbsoluteFill
        style={{
          transform: `translateX(${jx}px)`,
          background: `repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(239,68,68,${0.05 * intensity}) 4px)`,
        }}
      />
      <AbsoluteFill
        style={{
          transform: `translateX(${-jx}px)`,
          background: `repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(34,211,238,${0.05 * intensity}) 4px)`,
        }}
      />
    </AbsoluteFill>
  );
};
