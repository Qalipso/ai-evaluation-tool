import React from "react";
import { useCurrentFrame } from "remotion";
import { color, font, FPS } from "../theme";
import { reveal } from "./anim";

// "Deliberation" motif — the evaluator visibly *thinks* before it judges.
// Three pulsing dots + a cycling reasoning micro-thought. Recurs across scenes
// to tie the film to the theme: evaluation is weighing, not stamping.
export const Deliberation: React.FC<{
  thoughts: string[];
  start: number;
  label?: string;
}> = ({ thoughts, start, label = "Evaluating" }) => {
  const frame = useCurrentFrame();
  if (frame < start) return null;
  const local = frame - start;
  const idx = Math.floor(local / (FPS * 0.9)) % thoughts.length;
  const thought = thoughts[idx];

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        padding: "8px 16px",
        borderRadius: 999,
        background: color.accentSubtle,
        border: `1px solid ${color.accent}40`,
        ...reveal(frame, start, 10),
      }}
    >
      {/* pulsing thinking dots */}
      <span style={{ display: "inline-flex", gap: 5 }}>
        {[0, 1, 2].map((i) => {
          const phase = (local / FPS) * Math.PI * 2 - i * 0.6;
          const a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(phase));
          return <span key={i} style={{ width: 7, height: 7, borderRadius: 99, background: color.accentBright, opacity: a }} />;
        })}
      </span>
      <span style={{ fontFamily: font.mono, fontSize: 14, color: color.accentBright, letterSpacing: 0.5 }}>{label}</span>
      <span style={{ width: 1, height: 16, background: `${color.accent}55` }} />
      {/* cycling reasoning thought */}
      <span key={idx} style={{ fontFamily: font.mono, fontSize: 14, color: color.textSecondary }}>{thought}</span>
    </div>
  );
};
