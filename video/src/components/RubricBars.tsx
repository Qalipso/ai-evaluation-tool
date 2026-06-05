import React from "react";
import { useCurrentFrame } from "remotion";
import { color, font } from "../theme";
import { tween, reveal } from "./anim";
import type { RubricRow } from "../data";

// Stacked rubric dimensions; each bar grows to its score, color by pass/fail.
export const RubricBars: React.FC<{ rows: RubricRow[]; start: number; step?: number }> = ({
  rows,
  start,
  step = 7,
}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 13, width: "100%" }}>
      {rows.map((row, i) => {
        const d = start + i * step;
        if (frame < d) return null;
        const w = tween(frame, d, d + 24, 0, row.score);
        const barC = row.passed ? color.ok : color.bad;
        return (
          <div key={row.name} style={{ display: "flex", alignItems: "center", gap: 16, ...reveal(frame, d, 12) }}>
            <div style={{ width: 270, display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontFamily: font.sans, fontSize: 19, color: color.text, fontWeight: 500 }}>{row.name}</span>
              <span style={{ fontFamily: font.mono, fontSize: 12, color: color.textMuted }}>{row.method}</span>
            </div>
            <div style={{ flex: 1, height: 12, borderRadius: 99, background: color.bgCardSolid, border: `1px solid ${color.border}`, overflow: "hidden" }}>
              <div
                style={{
                  width: `${w}%`,
                  height: "100%",
                  borderRadius: 99,
                  background: `linear-gradient(90deg, ${barC}99, ${barC})`,
                  boxShadow: `0 0 10px ${barC}66`,
                }}
              />
            </div>
            <span style={{ width: 56, textAlign: "right", fontFamily: font.mono, fontSize: 20, color: barC, fontWeight: 600 }}>
              {Math.round(w)}
            </span>
          </div>
        );
      })}
    </div>
  );
};
