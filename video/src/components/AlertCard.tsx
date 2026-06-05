import React from "react";
import { useCurrentFrame } from "remotion";
import { color, font } from "../theme";
import { reveal } from "./anim";

// Failure alert card that drops in. Red for high severity, amber for medium.
export const AlertCard: React.FC<{
  kind: string;
  detail: string;
  severity: "high" | "med";
  at: number;
}> = ({ kind, detail, severity, at }) => {
  const frame = useCurrentFrame();
  const c = severity === "high" ? color.bad : color.warn;
  const sub = severity === "high" ? color.badSubtle : color.warnSubtle;
  const pulse = 1 + Math.sin(Math.max(0, frame - at) * 0.25) * 0.04;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "20px 26px",
        borderRadius: 16,
        background: `linear-gradient(180deg, ${sub}, transparent)`,
        border: `1px solid ${c}55`,
        boxShadow: `0 20px 50px -24px ${c}55`,
        ...reveal(frame, at, 30),
      }}
    >
      <div style={{ width: 12, height: 12, borderRadius: 99, background: c, boxShadow: `0 0 14px ${c}`, transform: `scale(${pulse})` }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontFamily: font.sans, fontSize: 26, fontWeight: 600, color: color.text }}>{kind}</span>
        <span style={{ fontFamily: font.mono, fontSize: 17, color: color.textSecondary }}>{detail}</span>
      </div>
      <div style={{ flex: 1 }} />
      <span style={{ fontFamily: font.mono, fontSize: 14, color: c, textTransform: "uppercase", letterSpacing: 1 }}>
        {severity === "high" ? "critical" : "warning"}
      </span>
    </div>
  );
};
