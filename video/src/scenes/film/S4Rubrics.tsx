import React from "react";
import { useCurrentFrame } from "remotion";
import { color, font, sec } from "../../theme";
import { ProductFrame } from "../../components/ProductFrame";
import { FilmShell } from "./FilmShell";
import { reveal, rise } from "../../components/anim";
import { rubricDims } from "../../data-film";

// Rubric dimensions calibrate in one by one. "Define what good means." ~9s.
export const S4Rubrics: React.FC<{ audio?: boolean }> = ({ audio }) => {
  const frame = useCurrentFrame();
  return (
    <FilmShell scene="rubrics" audio={audio} pad="80px 200px 150px">
      <ProductFrame title="evaluators / areamosa-assistant" badge={{ text: "rubric v3", tone: "accent" }}>
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
          <span style={{ fontFamily: font.sans, fontSize: 28, fontWeight: 600, color: color.text, ...reveal(frame, sec(0.2), 14) }}>
            Define what <span style={{ color: color.accentBright }}>“good”</span> means.
          </span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {rubricDims.map((d, i) => {
              const at = sec(0.6) + i * sec(0.55);
              if (frame < at) return null;
              const p = rise(frame, at);
              return (
                <div
                  key={d}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "16px 20px",
                    borderRadius: 12,
                    background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
                    border: `1px solid ${color.border}`,
                    ...reveal(frame, at, 16),
                  }}
                >
                  <span style={{ fontFamily: font.mono, fontSize: 14, color: color.accent, width: 26 }}>{String(i + 1).padStart(2, "0")}</span>
                  <span style={{ flex: 1, fontFamily: font.sans, fontSize: 22, color: color.text }}>{d}</span>
                  {/* calibrating meter */}
                  <div style={{ width: 90, height: 6, borderRadius: 99, background: color.bgCardSolid, overflow: "hidden" }}>
                    <div style={{ width: `${p * 100}%`, height: "100%", background: `linear-gradient(90deg, ${color.accentDeep}, ${color.accentBright})`, boxShadow: `0 0 8px ${color.accentGlow}` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </ProductFrame>
    </FilmShell>
  );
};
