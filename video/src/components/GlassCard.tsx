import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { color } from "../theme";
import { rise } from "./anim";

// Premium glass card: frosted panel + a light segment that travels around the
// border (border-beam) + a 3D pop-in. Replaces flat dashboard rows with
// something dynamic and expensive-looking.
export const GlassCard: React.FC<{
  children: React.ReactNode;
  delay?: number;
  radius?: number;
  padding?: string;
  tone?: string; // beam/glow color
  beam?: boolean;
  speed?: number; // deg per frame
  style?: React.CSSProperties;
}> = ({ children, delay = 0, radius = 14, padding = "16px 20px", tone = color.accent, beam = true, speed = 5, style }) => {
  const frame = useCurrentFrame();
  const p = rise(frame, delay);
  const angle = (frame * speed) % 360;
  const lift = interpolate(p, [0, 1], [22, 0]);
  const rot = interpolate(p, [0, 1], [8, 0]);

  return (
    <div
      style={{
        position: "relative",
        borderRadius: radius,
        opacity: p,
        transform: `translateY(${lift}px) rotateX(${rot}deg)`,
        transformOrigin: "50% 100%",
        ...style,
      }}
    >
      {/* traveling border beam */}
      {beam && (
        <div
          style={{
            position: "absolute",
            inset: -1,
            borderRadius: radius + 1,
            background: `conic-gradient(from ${angle}deg, transparent 0deg, transparent 250deg, ${tone}00 285deg, ${tone} 320deg, ${tone}00 360deg)`,
            opacity: 0.9 * p,
            filter: "blur(0.5px)",
          }}
        />
      )}
      {/* glass body */}
      <div
        style={{
          position: "relative",
          borderRadius: radius,
          padding,
          background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))",
          border: `1px solid ${color.border}`,
          backdropFilter: "blur(6px)",
          boxShadow: `0 18px 40px -22px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.02) inset`,
          overflow: "hidden",
        }}
      >
        {/* top sheen */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)" }} />
        {children}
      </div>
    </div>
  );
};
