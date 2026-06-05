import React from "react";
import { useCurrentFrame } from "remotion";
import { color, font } from "../theme";
import { rise } from "./anim";

// Horizontal flow strip: Answer -> Claims -> Evidence -> Verdict. Nodes light
// up in sequence and connectors fill, showing the eval pipeline at a glance.
export const PipelineFlow: React.FC<{
  steps: string[];
  start: number;
  step?: number;
}> = ({ steps, start, step = 10 }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
      {steps.map((label, i) => {
        const at = start + i * step;
        const active = frame >= at;
        const p = rise(frame, at);
        const c = active ? color.accent : color.border;
        return (
          <React.Fragment key={label}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 16px",
                borderRadius: 10,
                background: active ? color.accentSubtle : "rgba(255,255,255,0.02)",
                border: `1px solid ${active ? color.accent + "55" : color.border}`,
                opacity: 0.4 + p * 0.6,
                transform: `scale(${0.96 + p * 0.04})`,
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 99, background: c, boxShadow: active ? `0 0 10px ${color.accentGlow}` : "none" }} />
              <span style={{ fontFamily: font.mono, fontSize: 15, color: active ? color.text : color.textMuted }}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, margin: "0 8px", background: color.border, position: "relative", overflow: "hidden" }}>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: `${Math.max(0, Math.min(1, (frame - (at + step * 0.4)) / (step * 0.6))) * 100}%`,
                    background: `linear-gradient(90deg, ${color.accentDeep}, ${color.accentBright})`,
                    boxShadow: `0 0 8px ${color.accentGlow}`,
                  }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
