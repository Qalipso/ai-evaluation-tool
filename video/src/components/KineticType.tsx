import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { color, font } from "../theme";
import { rise } from "./anim";

export type Word = {
  text: string;
  size?: number; // px
  weight?: number;
  color?: string;
  italic?: boolean;
  mono?: boolean;
  track?: number; // letter-spacing
};

// Big, varied kinetic words that SLAM in on a tight beat: clip-path wipe +
// y-slam + scale overshoot, staggered per word. The montage backbone — bold
// typography, not dashboard slides.
export const KineticType: React.FC<{
  words: Word[];
  start?: number;
  step?: number; // frames between words
  align?: "center" | "flex-start";
  gap?: number;
  lineGap?: number;
}> = ({ words, start = 0, step = 7, align = "center", gap = 18 }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap, justifyContent: align, alignItems: "baseline", width: "100%" }}>
      {words.map((w, i) => {
        const at = start + i * step;
        if (frame < at) return null;
        const p = rise(frame, at);
        const wipe = interpolate(p, [0, 1], [100, 0]);
        const y = interpolate(p, [0, 1], [40, 0], { easing: Easing.out(Easing.cubic) });
        const scale = interpolate(p, [0, 0.6, 1], [1.25, 1.02, 1]);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              fontFamily: w.mono ? font.mono : font.sans,
              fontSize: w.size ?? 110,
              fontWeight: w.weight ?? 800,
              fontStyle: w.italic ? "italic" : "normal",
              letterSpacing: w.track ?? -3,
              lineHeight: 0.95,
              color: w.color ?? color.text,
              transform: `translateY(${y}px) scale(${scale})`,
              transformOrigin: "50% 100%",
              clipPath: `inset(0 0 ${wipe}% 0)`,
              willChange: "transform, clip-path",
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
};
