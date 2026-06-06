import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { color } from "../theme";

// Aurora backdrop — slow drifting color blobs (aurora-borealis style) for
// premium title/CTA scenes. Soft, blurred, never competes with text.
export const Aurora: React.FC<{ intensity?: number }> = ({ intensity = 1 }) => {
  const frame = useCurrentFrame();
  const blob = (seed: number, c: string, size: number) => {
    const a = (frame * 0.4 + seed * 80) * (Math.PI / 180);
    const x = 50 + Math.sin(a) * 26 + Math.cos(a * 0.6) * 8;
    const y = 45 + Math.cos(a * 0.8) * 20 + Math.sin(a * 0.5) * 6;
    return (
      <div
        style={{
          position: "absolute",
          left: `${x}%`,
          top: `${y}%`,
          width: size,
          height: size,
          transform: "translate(-50%,-50%)",
          background: `radial-gradient(circle, ${c} 0%, transparent 62%)`,
          filter: "blur(70px)",
          opacity: 0.5 * intensity,
          mixBlendMode: "screen",
        }}
      />
    );
  };
  const breathe = interpolate(Math.sin(frame * 0.03), [-1, 1], [0.85, 1.05]);
  return (
    <AbsoluteFill style={{ background: color.bgBase, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${breathe})` }}>
        {blob(0, color.accentDeep, 1100)}
        {blob(2, color.accent, 900)}
        {blob(4, color.accentBright, 750)}
        {blob(5, "#1d4ed8", 820)}
      </AbsoluteFill>
      {/* dark floor + grain-friendly vignette */}
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, transparent 30%, ${color.bgBase}dd 85%)` }} />
    </AbsoluteFill>
  );
};
