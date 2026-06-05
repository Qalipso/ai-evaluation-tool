import React from "react";
import { useCurrentFrame } from "remotion";
import { color, font } from "../theme";
import { reveal } from "./anim";
import type { Gate } from "../data-film";

// 2x3 grid of safety gate cards. Each lands in sequence; the BLOCKED card
// pulses red. `revealStatusAt` delays the pass/block stamp so cards first
// appear "checking…" then resolve.
export const SafetyGateGrid: React.FC<{
  gates: Gate[];
  start: number;
  step?: number;
  resolveAt: number;
}> = ({ gates, start, step = 7, resolveAt }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18, width: "100%" }}>
      {gates.map((g, i) => {
        const at = start + i * step;
        if (frame < at) return null;
        const resolved = frame >= resolveAt + i * 3;
        const blocked = g.status === "blocked";
        const c = !resolved ? color.textMuted : blocked ? color.bad : color.ok;
        const pulse = blocked && resolved ? 1 + Math.sin(frame * 0.25) * 0.05 : 1;
        return (
          <div
            key={g.name}
            style={{
              padding: "22px 22px",
              borderRadius: 16,
              background: resolved && blocked ? color.badSubtle : "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
              border: `1px solid ${resolved ? c + "55" : color.border}`,
              boxShadow: resolved && blocked ? `0 0 40px ${color.bad}44` : "none",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              ...reveal(frame, at, 18),
              transform: `${reveal(frame, at, 18).transform} scale(${pulse})`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: 99, background: c, boxShadow: resolved ? `0 0 12px ${c}` : "none" }} />
              <span style={{ fontFamily: font.sans, fontSize: 22, fontWeight: 600, color: color.text }}>{g.name}</span>
            </div>
            <span
              style={{
                alignSelf: "flex-start",
                fontFamily: font.mono,
                fontSize: 15,
                letterSpacing: 1,
                color: c,
                border: `1px solid ${c}55`,
                background: `${c}14`,
                padding: "5px 14px",
                borderRadius: 8,
              }}
            >
              {!resolved ? "CHECKING…" : blocked ? "BLOCKED" : "PASS"}
            </span>
          </div>
        );
      })}
    </div>
  );
};
