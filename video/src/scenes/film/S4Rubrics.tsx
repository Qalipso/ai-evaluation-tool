import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { color, font, sec } from "../../theme";
import { ProductFrame } from "../../components/ProductFrame";
import { GlassCard } from "../../components/GlassCard";
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: font.sans, fontSize: 28, fontWeight: 600, color: color.text, ...reveal(frame, sec(0.2), 14) }}>
              Define what <span style={{ color: color.accentBright }}>“good”</span> means.
            </span>
            {frame >= sec(3.6) && (
              <span
                style={{
                  fontSize: 54,
                  lineHeight: 1,
                  transform: `scale(${0.6 + rise(frame, sec(3.6)) * 0.4}) rotate(${interpolate(rise(frame, sec(3.6)), [0, 1], [-18, 0])}deg)`,
                  filter: `drop-shadow(0 0 18px ${color.accentGlow})`,
                }}
              >
                👍
              </span>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {rubricDims.map((d, i) => {
              const at = sec(0.6) + i * sec(0.55);
              if (frame < at) return null;
              const p = rise(frame, at);
              return (
                <GlassCard key={d.name} delay={at} radius={12} padding="16px 20px" speed={4}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ fontFamily: font.mono, fontSize: 14, color: color.accent, width: 26 }}>{String(i + 1).padStart(2, "0")}</span>
                    <span style={{ flex: 1, fontFamily: font.sans, fontSize: 22, color: color.text }}>{d.name}</span>
                    {/* calibrating meter to the dimension's score */}
                    <div style={{ width: 90, height: 6, borderRadius: 99, background: color.bgCardSolid, overflow: "hidden" }}>
                      <div style={{ width: `${p * d.score * 100}%`, height: "100%", background: `linear-gradient(90deg, ${color.accentDeep}, ${color.accentBright})`, boxShadow: `0 0 8px ${color.accentGlow}` }} />
                    </div>
                    <span style={{ width: 48, textAlign: "right", fontFamily: font.mono, fontSize: 17, color: color.textSecondary }}>{(p * d.score).toFixed(2)}</span>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      </ProductFrame>
    </FilmShell>
  );
};
