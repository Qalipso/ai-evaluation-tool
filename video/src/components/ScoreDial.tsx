import React from "react";
import { useCurrentFrame } from "remotion";
import { color, font } from "../theme";
import { tween, rise } from "./anim";

// Radial score gauge that counts 0 -> value with a sweeping electric arc.
export const ScoreDial: React.FC<{
  value: number;
  start: number;
  size?: number;
}> = ({ value, start, size = 230 }) => {
  const frame = useCurrentFrame();
  const dur = 36;
  const v = Math.round(tween(frame, start, start + dur, 0, value));
  const r = size / 2 - 16;
  const c = 2 * Math.PI * r;
  const pct = v / 100;
  const stroke = value >= 80 ? color.ok : value >= 60 ? color.warn : color.bad;
  const pop = rise(frame, start);

  return (
    <div style={{ width: size, height: size, position: "relative", transform: `scale(${0.9 + pop * 0.1})` }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color.border} strokeWidth={12} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ filter: `drop-shadow(0 0 8px ${stroke}aa)` }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: font.sans, fontSize: 66, fontWeight: 700, color: color.text, lineHeight: 1 }}>{v}</span>
        <span style={{ fontFamily: font.mono, fontSize: 16, color: color.textMuted, marginTop: 4 }}>/ 100</span>
      </div>
    </div>
  );
};
