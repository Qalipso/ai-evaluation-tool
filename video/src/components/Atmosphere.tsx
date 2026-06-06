import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { color } from "../theme";

// Faint horizontal scan lines — adds a technical "monitor" texture.
export const ScanLines: React.FC<{ opacity?: number }> = ({ opacity = 0.05 }) => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      opacity,
      backgroundImage: `repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0px, rgba(255,255,255,0.6) 1px, transparent 2px, transparent 4px)`,
      mixBlendMode: "overlay",
    }}
  />
);

// A slow diagonal light sweep — premium glass "shine" crossing the frame once
// across the scene, giving cinematic depth without distracting.
export const LightSweep: React.FC<{ delay?: number; band?: number }> = ({ delay = 8, band = 36 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = interpolate(frame, [delay, durationInFrames], [-30, 130], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen", opacity: 0.5 }}>
      <AbsoluteFill
        style={{
          background: `linear-gradient(115deg, transparent ${t - band}%, ${color.accentSubtle} ${t - band / 2}%, rgba(255,255,255,0.08) ${t}%, ${color.accentSubtle} ${t + band / 2}%, transparent ${t + band}%)`,
        }}
      />
    </AbsoluteFill>
  );
};

// Soft blurred depth blob behind content — parallax glass bloom.
export const DepthBloom: React.FC<{ x?: number; y?: number }> = ({ x = 50, y = 42 }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <div
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        width: 900,
        height: 900,
        transform: "translate(-50%,-50%)",
        background: `radial-gradient(circle, ${color.accentGlow} 0%, transparent 60%)`,
        filter: "blur(60px)",
        opacity: 0.35,
      }}
    />
  </AbsoluteFill>
);
