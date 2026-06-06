import { interpolate, spring, Easing } from "remotion";
import { FPS } from "../theme";

// Reveal a value 0->1 with a snappy spring (quick pop, tiny overshoot),
// starting at `delay` frames. Punchy, not floaty.
export const rise = (frame: number, delay: number, fps = FPS) =>
  spring({ frame: frame - delay, fps, config: { damping: 18, mass: 0.5, stiffness: 160 } });

// Fade + slide-up reveal, returns style props.
export const reveal = (frame: number, delay: number, dist = 24) => {
  const p = rise(frame, delay);
  return {
    opacity: p,
    transform: `translateY(${interpolate(p, [0, 1], [dist, 0])}px)`,
  };
};

// Typewriter: how many chars of `text` are visible at `frame`.
export const typed = (
  frame: number,
  start: number,
  text: string,
  cps = 56,
) => {
  const n = Math.floor(Math.max(0, frame - start) * (cps / FPS));
  return text.slice(0, Math.min(text.length, n));
};

export const charsDone = (start: number, text: string, cps = 56) =>
  start + Math.ceil((text.length / cps) * FPS);

// Ease a number from->to over [a,b] frames.
export const tween = (
  frame: number,
  a: number,
  b: number,
  from: number,
  to: number,
) =>
  interpolate(frame, [a, b], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
