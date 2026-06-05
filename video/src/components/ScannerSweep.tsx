import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { color } from "../theme";

// A bright vertical line that sweeps left-to-right across its parent once,
// "scanning" the content beneath. Pure overlay; absolutely positioned, so the
// parent should be position:relative + overflow:hidden.
export const ScannerSweep: React.FC<{ start: number; dur: number; vertical?: boolean }> = ({ start, dur, vertical = false }) => {
  const frame = useCurrentFrame();
  if (frame < start || frame > start + dur) return null;
  const t = interpolate(frame, [start, start + dur], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fade = interpolate(frame, [start, start + dur * 0.15, start + dur * 0.85, start + dur], [0, 1, 1, 0]);
  const pos = vertical ? { top: `${t}%`, left: 0, right: 0, height: 3 } : { left: `${t}%`, top: 0, bottom: 0, width: 3 };
  const grad = vertical
    ? `linear-gradient(90deg, transparent, ${color.accentBright}, transparent)`
    : `linear-gradient(180deg, transparent, ${color.accentBright}, transparent)`;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          ...pos,
          background: grad,
          boxShadow: `0 0 22px ${color.accentGlow}`,
          opacity: fade,
        }}
      />
      {/* faint trailing wash */}
      <div
        style={{
          position: "absolute",
          ...(vertical
            ? { top: 0, left: 0, right: 0, height: `${t}%` }
            : { top: 0, bottom: 0, left: 0, width: `${t}%` }),
          background: `linear-gradient(${vertical ? "180deg" : "90deg"}, ${color.accentSubtle}, transparent)`,
          opacity: fade * 0.6,
        }}
      />
    </AbsoluteFill>
  );
};
