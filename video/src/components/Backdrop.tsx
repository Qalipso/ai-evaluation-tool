import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { color } from "../theme";

// Near-black base with a faint engineering grid and a slow electric-blue glow
// drifting behind the product surface. Sets the "cockpit" mood.
export const Backdrop: React.FC<{ glow?: "accent" | "bad" }> = ({ glow = "accent" }) => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame % 600, [0, 600], [0, 1]);
  const gx = 50 + Math.sin(drift * Math.PI * 2) * 12;
  const gy = 40 + Math.cos(drift * Math.PI * 2) * 8;
  const glowColor = glow === "bad" ? color.badGlow : color.accentGlow;

  return (
    <AbsoluteFill style={{ background: color.bgBase }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${gx}% ${gy}%, ${glowColor} 0%, transparent 45%)`,
          opacity: 0.5,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${color.hairline} 1px, transparent 1px), linear-gradient(90deg, ${color.hairline} 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(circle at 50% 45%, black 0%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(circle at 50% 45%, black 0%, transparent 80%)",
          opacity: 0.6,
        }}
      />
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, transparent 60%, ${color.bgBase} 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};
