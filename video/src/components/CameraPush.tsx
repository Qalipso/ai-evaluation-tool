import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";

// Slow cinematic dolly with subtle 3D: scale + drift + a gentle perspective
// tilt across the scene, so content reads as a floating plane in depth (rich,
// not gimmicky). Sells "filmed", not "rendered".
export const CameraPush: React.FC<{
  children: React.ReactNode;
  from?: number;
  to?: number;
  driftX?: number;
  driftY?: number;
  tilt?: number; // peak rotateY degrees
}> = ({ children, from = 1.0, to = 1.05, driftX = 0, driftY = -10, tilt = 3 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.ease),
  });
  const scale = interpolate(t, [0, 1], [from, to]);
  const x = interpolate(t, [0, 1], [0, driftX]);
  const y = interpolate(t, [0, 1], [0, driftY]);
  // ease the tilt in then settle to 0 — a slow 3D "set down"
  const ry = interpolate(t, [0, 0.6, 1], [tilt, tilt * 0.3, 0]);
  const rx = interpolate(t, [0, 1], [tilt * 0.4, 0]);
  return (
    <AbsoluteFill style={{ perspective: 2200, perspectiveOrigin: "50% 45%" }}>
      <AbsoluteFill
        style={{
          transform: `translate(${x}px, ${y}px) scale(${scale}) rotateY(${ry}deg) rotateX(${rx}deg)`,
          transformOrigin: "50% 45%",
          transformStyle: "preserve-3d",
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
