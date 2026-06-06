import React from "react";
import { color, font } from "../theme";
import { GlassCard } from "./GlassCard";

// Small KPI card: glass panel with a traveling border beam + 3D pop.
export const MetricCard: React.FC<{
  label: string;
  value: string;
  at: number;
  tone?: "accent" | "ok" | "muted";
}> = ({ label, value, at, tone = "muted" }) => {
  const c = tone === "ok" ? color.ok : tone === "accent" ? color.accent : color.text;
  const beamTone = tone === "ok" ? color.ok : color.accent;
  return (
    <GlassCard delay={at} radius={16} padding="22px 24px" tone={beamTone} style={{ flex: 1 }}>
      <div style={{ fontFamily: font.mono, fontSize: 14, color: color.textMuted, letterSpacing: 0.6, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontFamily: font.sans, fontSize: 40, fontWeight: 700, color: c, marginTop: 8, lineHeight: 1 }}>{value}</div>
    </GlassCard>
  );
};
