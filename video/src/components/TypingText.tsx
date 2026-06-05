import React from "react";
import { useCurrentFrame } from "remotion";
import { color, font } from "../theme";
import { typed } from "./anim";

// Deterministic typewriter with blinking caret. Wraps the `typed` helper as a
// reusable element for any scene.
export const TypingText: React.FC<{
  text: string;
  start?: number;
  cps?: number;
  style?: React.CSSProperties;
  caret?: boolean;
}> = ({ text, start = 0, cps = 38, style, caret = true }) => {
  const frame = useCurrentFrame();
  const shown = typed(frame, start, text, cps);
  const done = shown.length >= text.length;
  return (
    <span style={{ fontFamily: font.sans, color: color.text, ...style }}>
      {shown}
      {caret && !done && <span style={{ color: color.accent, opacity: frame % 16 < 8 ? 1 : 0 }}>▋</span>}
    </span>
  );
};
