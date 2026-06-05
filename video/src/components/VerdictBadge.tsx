import React from "react";
import { useCurrentFrame } from "remotion";
import { color, font } from "../theme";
import { rise, tween } from "./anim";

// Big "Ship-ready" verdict badge with a score read-out that counts up.
export const VerdictBadge: React.FC<{
  label: string;
  score: number; // 0-1
  at: number;
}> = ({ label, score, at }) => {
  const frame = useCurrentFrame();
  const pop = rise(frame, at);
  const v = tween(frame, at, at + 30, 0, score);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 26, transform: `scale(${0.92 + pop * 0.08})`, opacity: pop }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "16px 26px",
          borderRadius: 999,
          background: color.okSubtle,
          border: `1px solid ${color.ok}66`,
          boxShadow: `0 0 50px ${color.ok}33`,
        }}
      >
        <span style={{ width: 14, height: 14, borderRadius: 99, background: color.ok, boxShadow: `0 0 14px ${color.ok}` }} />
        <span style={{ fontFamily: font.sans, fontSize: 34, fontWeight: 700, color: color.ok }}>{label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontFamily: font.sans, fontSize: 56, fontWeight: 700, color: color.text }}>{v.toFixed(2)}</span>
        <span style={{ fontFamily: font.mono, fontSize: 22, color: color.textMuted }}>/ 1.0</span>
      </div>
    </div>
  );
};
