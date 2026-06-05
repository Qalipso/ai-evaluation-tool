import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";

// Slow cinematic dolly: a near-imperceptible scale + drift across the scene's
// full length. Sells "filmed", not "rendered". Wrap a scene's body.
export const CameraPush: React.FC<{
  children: React.ReactNode;
  from?: number;
  to?: number;
  driftX?: number;
  driftY?: number;
}> = ({ children, from = 1.0, to = 1.05, driftX = 0, driftY = -10 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.ease),
  });
  const scale = interpolate(t, [0, 1], [from, to]);
  const x = interpolate(t, [0, 1], [0, driftX]);
  const y = interpolate(t, [0, 1], [0, driftY]);
  return (
    <AbsoluteFill style={{ transform: `scale(${scale}) translate(${x}px, ${y}px)`, transformOrigin: "50% 45%" }}>
      {children}
    </AbsoluteFill>
  );
};
