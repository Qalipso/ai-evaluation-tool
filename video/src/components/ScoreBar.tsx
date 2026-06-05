import React from "react";
import { useCurrentFrame } from "remotion";
import { color, font } from "../theme";
import { tween, reveal } from "./anim";

// Single labelled score bar that fills 0 -> value. Color by pass/fail.
export const ScoreBar: React.FC<{
  label: string;
  value: number; // 0-100
  at: number;
  passed?: boolean;
  sub?: string;
}> = ({ label, value, at, passed = true, sub }) => {
  const frame = useCurrentFrame();
  const w = tween(frame, at, at + 24, 0, value);
  const c = passed ? color.ok : color.bad;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, ...reveal(frame, at, 12) }}>
      <div style={{ width: 250, display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontFamily: font.sans, fontSize: 19, color: color.text, fontWeight: 500 }}>{label}</span>
        {sub && <span style={{ fontFamily: font.mono, fontSize: 12, color: color.textMuted }}>{sub}</span>}
      </div>
      <div style={{ flex: 1, height: 12, borderRadius: 99, background: color.bgCardSolid, border: `1px solid ${color.border}`, overflow: "hidden" }}>
        <div style={{ width: `${w}%`, height: "100%", borderRadius: 99, background: `linear-gradient(90deg, ${c}99, ${c})`, boxShadow: `0 0 10px ${c}66` }} />
      </div>
      <span style={{ width: 52, textAlign: "right", fontFamily: font.mono, fontSize: 20, color: c, fontWeight: 600 }}>{Math.round(w)}</span>
    </div>
  );
};
