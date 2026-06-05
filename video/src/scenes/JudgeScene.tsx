import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Audio, staticFile } from "remotion";
import { color, font, sec } from "../theme";
import { Backdrop } from "../components/Backdrop";
import { ProductFrame } from "../components/ProductFrame";
import { ScoreDial } from "../components/ScoreDial";
import { RubricBars } from "../components/RubricBars";
import { Caption } from "../components/Caption";
import { typed, reveal } from "../components/anim";
import { judgeScore, judgeRubric, judgePassed, judgeFailed, judgeRationale } from "../data";
import { narration } from "../narration";

const Verdict: React.FC<{ frame: number; at: number; tone: "ok" | "bad"; items: string[]; head: string }> = ({ frame, at, tone, items, head }) => {
  const c = tone === "ok" ? color.ok : color.bad;
  return (
    <div style={{ ...reveal(frame, at, 14) }}>
      <span style={{ fontFamily: font.mono, fontSize: 14, color: c, letterSpacing: 1, textTransform: "uppercase" }}>{head}</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
        {items.map((t, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", ...reveal(frame, at + 6 + i * 5, 8) }}>
            <span style={{ color: c, fontFamily: font.mono, fontSize: 18, marginTop: 1 }}>{tone === "ok" ? "✓" : "✕"}</span>
            <span style={{ fontFamily: font.sans, fontSize: 18, color: color.textSecondary, lineHeight: 1.35 }}>{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Beat: score dial counts up, rubric bars fill, pass/fail evidence, then the
// judge rationale types out. ~15s.
export const JudgeScene: React.FC<{ audio?: boolean }> = ({ audio }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const dialAt = sec(0.6);
  const barsAt = sec(2.2);
  const passAt = sec(5.6);
  const failAt = sec(7.4);
  const ratAt = sec(9.2);

  return (
    <AbsoluteFill>
      <Backdrop glow="accent" />
      {audio && <Audio src={staticFile(narration.judge.audio)} />}

      <AbsoluteFill style={{ padding: "70px 130px 150px" }}>
        <ProductFrame title="runs / whatsapp-booking-agent · evaluation result" badge={{ text: "rubric v3", tone: "accent" }}>
          <div style={{ display: "flex", gap: 40, width: "100%" }}>
            {/* left: dial + verdicts */}
            <div style={{ width: 430, flexShrink: 0, display: "flex", flexDirection: "column", gap: 26 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
                <ScoreDial value={judgeScore} start={dialAt} size={200} />
                <div style={{ ...reveal(frame, dialAt + 10, 16) }}>
                  <div style={{ fontFamily: font.sans, fontSize: 26, fontWeight: 600, color: color.text }}>Acceptable</div>
                  <div style={{ fontFamily: font.mono, fontSize: 16, color: color.textMuted, marginTop: 4 }}>with caveats</div>
                </div>
              </div>
              {frame >= passAt && <Verdict frame={frame} at={passAt} tone="ok" head="Passed" items={judgePassed} />}
              {frame >= failAt && <Verdict frame={frame} at={failAt} tone="bad" head="Failed" items={judgeFailed} />}
            </div>

            <div style={{ width: 1, background: color.border }} />

            {/* right: rubric + rationale */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 26, minWidth: 0 }}>
              <span style={{ fontFamily: font.mono, fontSize: 14, color: color.textMuted, letterSpacing: 1, textTransform: "uppercase", ...reveal(frame, barsAt, 10) }}>
                Rubric breakdown · 6 dimensions
              </span>
              {frame >= barsAt && <RubricBars rows={judgeRubric} start={barsAt} step={6} />}
              {frame >= ratAt && (
                <div style={{ marginTop: "auto", padding: "20px 22px", borderRadius: 14, background: "rgba(59,130,246,0.07)", border: `1px solid ${color.accent}33`, ...reveal(frame, ratAt, 16) }}>
                  <span style={{ fontFamily: font.mono, fontSize: 13, color: color.accent, letterSpacing: 1, textTransform: "uppercase" }}>Judge rationale</span>
                  <p style={{ margin: "10px 0 0", fontFamily: font.sans, fontSize: 20, lineHeight: 1.5, color: color.text }}>
                    {typed(frame, ratAt + 6, judgeRationale, 52)}
                    {typed(frame, ratAt + 6, judgeRationale, 52).length < judgeRationale.length && (
                      <span style={{ color: color.accent, opacity: frame % 16 < 8 ? 1 : 0 }}>▋</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </ProductFrame>
      </AbsoluteFill>

      <Caption text={narration.judge.text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
