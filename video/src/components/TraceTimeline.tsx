import React from "react";
import { useCurrentFrame } from "remotion";
import { color, font } from "../theme";
import { reveal, rise } from "./anim";
import type { TraceEvent } from "../data";

const toneColor = (t?: TraceEvent["tone"]) =>
  t === "ok" ? color.ok : t === "bad" ? color.bad : t === "accent" ? color.accent : color.textMuted;

// Horizontal event timeline that fills left-to-right as events land.
export const TraceTimeline: React.FC<{
  events: TraceEvent[];
  start: number;
  step?: number;
}> = ({ events, start, step = 12 }) => {
  const frame = useCurrentFrame();
  const lastDelay = start + (events.length - 1) * step;
  const lineP = rise(frame, start) * Math.min(1, (frame - start) / Math.max(1, lastDelay - start));

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ width: 7, height: 7, borderRadius: 99, background: color.accent }} />
        <span style={{ fontFamily: font.mono, fontSize: 14, color: color.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>
          Decision trace
        </span>
      </div>
      <div style={{ position: "relative", padding: "0 4px" }}>
        {/* base rail */}
        <div style={{ position: "absolute", top: 7, left: 8, right: 8, height: 2, background: color.border }} />
        {/* filled rail */}
        <div
          style={{
            position: "absolute",
            top: 7,
            left: 8,
            width: `calc(${Math.min(1, Math.max(0, (frame - start) / Math.max(1, lastDelay - start)))} * (100% - 16px))`,
            height: 2,
            background: `linear-gradient(90deg, ${color.accentDeep}, ${color.accentBright})`,
            boxShadow: `0 0 10px ${color.accentGlow}`,
            opacity: lineP,
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {events.map((ev, i) => {
            const d = start + i * step;
            if (frame < d) return null;
            const c = toneColor(ev.tone);
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", ...reveal(frame, d, 10) }}>
                <span style={{ width: 14, height: 14, borderRadius: 99, background: color.bgBase, border: `2px solid ${c}`, boxShadow: `0 0 12px ${c}66`, zIndex: 1 }} />
                <span style={{ fontFamily: font.mono, fontSize: 14, color: color.text, marginTop: 12 }}>{ev.label}</span>
                <span style={{ fontFamily: font.mono, fontSize: 12, color: color.textMuted, marginTop: 3 }}>{ev.detail}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
