import React from "react";
import { useCurrentFrame } from "remotion";
import { color, font } from "../theme";
import { reveal } from "./anim";

// Small KPI card: label + value, optional accent tone.
export const MetricCard: React.FC<{
  label: string;
  value: string;
  at: number;
  tone?: "accent" | "ok" | "muted";
}> = ({ label, value, at, tone = "muted" }) => {
  const frame = useCurrentFrame();
  const c = tone === "ok" ? color.ok : tone === "accent" ? color.accent : color.text;
  return (
    <div
      style={{
        flex: 1,
        padding: "22px 24px",
        borderRadius: 16,
        background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
        border: `1px solid ${color.border}`,
        ...reveal(frame, at, 22),
      }}
    >
      <div style={{ fontFamily: font.mono, fontSize: 14, color: color.textMuted, letterSpacing: 0.6, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontFamily: font.sans, fontSize: 40, fontWeight: 700, color: c, marginTop: 8, lineHeight: 1 }}>{value}</div>
    </div>
  );
};
