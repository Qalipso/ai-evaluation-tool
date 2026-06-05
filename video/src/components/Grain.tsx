import React from "react";
import { AbsoluteFill } from "remotion";

// Static film grain via an SVG turbulence texture. Very low opacity — adds a
// premium, less-digital finish without flicker (deterministic, render-safe).
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.05 }) => {
  const svg = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>`,
  );
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        mixBlendMode: "overlay",
        opacity,
        backgroundImage: `url("data:image/svg+xml,${svg}")`,
        backgroundSize: "160px 160px",
      }}
    />
  );
};
