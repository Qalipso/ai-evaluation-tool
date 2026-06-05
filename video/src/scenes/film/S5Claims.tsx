import React from "react";
import { useCurrentFrame } from "remotion";
import { color, font, sec } from "../../theme";
import { ProductFrame } from "../../components/ProductFrame";
import { ClaimHighlighter } from "../../components/ClaimHighlighter";
import { PipelineFlow } from "../../components/PipelineFlow";
import { SceneTitle } from "../../components/SceneTitle";
import { FilmShell } from "./FilmShell";
import { reveal } from "../../components/anim";
import { claimAnswer, filmClaims, evidencePanel } from "../../data-film";

// HERO: answer split into claims, checked against an evidence panel. ~12s.
export const S5Claims: React.FC<{ audio?: boolean }> = ({ audio }) => {
  const frame = useCurrentFrame();
  const eviAt = sec(2.2);
  return (
    <FilmShell scene="claims" audio={audio} pad="60px 150px 150px">
      <ProductFrame title="cases / areamosa · claim pipeline" badge={{ text: "grounding", tone: "accent" }}>
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 22 }}>
          <SceneTitle eyebrow="claim pipeline" title="Every claim is checked against evidence." highlight="evidence" at={sec(0.2)} />
          <PipelineFlow steps={["Answer", "Extract claims", "Retrieve evidence", "Score", "Verdict"]} start={sec(0.5)} step={9} />
          <div style={{ display: "flex", gap: 36, width: "100%" }}>
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <ClaimHighlighter answer={claimAnswer} claims={filmClaims} start={sec(1.8)} step={sec(0.95)} />
            </div>
            <div style={{ width: 1, background: color.border }} />
          {/* evidence panel */}
          <div style={{ width: 380, flexShrink: 0, display: "flex", flexDirection: "column", gap: 16, ...reveal(frame, eviAt, 18) }}>
            <span style={{ fontFamily: font.mono, fontSize: 14, color: color.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>Evidence</span>
            {evidencePanel.map((e, i) => {
              const at = eviAt + i * 8;
              if (frame < at) return null;
              return (
                <div key={e.k} style={{ display: "flex", flexDirection: "column", gap: 5, padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: `1px solid ${color.border}`, ...reveal(frame, at, 12) }}>
                  <span style={{ fontFamily: font.sans, fontSize: 15, color: color.textMuted }}>{e.k}</span>
                  <span style={{ fontFamily: font.mono, fontSize: 17, color: color.text }}>{e.v}</span>
                </div>
              );
            })}
            </div>
          </div>
        </div>
      </ProductFrame>
    </FilmShell>
  );
};
