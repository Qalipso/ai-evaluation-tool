import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { color, font, sec } from "../../theme";
import { ProductFrame } from "../../components/ProductFrame";
import { GlitchOverlay } from "../../components/GlitchOverlay";
import { ScannerSweep } from "../../components/ScannerSweep";
import { FilmShell } from "./FilmShell";
import { typed, reveal, rise } from "../../components/anim";
import { hookAnswer, hookEvidence, hookFailure, demoCase } from "../../data-film";

// The confident lie: agent answer scanned, a claim flagged, evidence
// contradicts it, FALSE CONFIRMATION stamp lands. ~5s.
export const S1Hook: React.FC<{ audio?: boolean }> = ({ audio }) => {
  const frame = useCurrentFrame();
  const scanAt = sec(1.4);
  const flagAt = sec(2.1);
  const eviAt = sec(2.8);
  const stampAt = sec(3.4);
  const shown = typed(frame, sec(0.4), hookAnswer.text, 30);
  const flagged = frame >= flagAt;
  const parts = hookAnswer.text.split(hookAnswer.flag);
  const stampP = rise(frame, stampAt);
  const stampRot = interpolate(stampP, [0, 1], [-14, -7]);

  return (
    <FilmShell scene="hook" audio={audio} glow={flagged ? "bad" : "accent"} pad="100px 220px" bg="video/generated/hook-robots.mp4" bgVideo bgOpacity={0.5}>
      <ProductFrame
        title={`${demoCase.project} · WhatsApp`}
        badge={flagged ? { text: "Unsupported claim", tone: "bad" } : { text: "agent reply", tone: "accent" }}
      >
        <div style={{ width: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 22 }}>
          <span style={{ fontFamily: font.mono, fontSize: 14, color: color.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>Agent</span>

          {/* answer bubble with a scanning sweep */}
          <div style={{ position: "relative", alignSelf: "flex-start", maxWidth: "85%" }}>
            <div
              style={{
                fontFamily: font.sans,
                fontSize: 30,
                lineHeight: 1.45,
                color: color.text,
                background: "rgba(124,108,255,0.10)",
                border: `1px solid ${color.accent}3a`,
                borderRadius: 18,
                borderTopLeftRadius: 4,
                padding: "20px 26px",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {!flagged ? (
                <>
                  {shown}
                  {shown.length < hookAnswer.text.length && <span style={{ color: color.accent, opacity: frame % 16 < 8 ? 1 : 0 }}>▋</span>}
                </>
              ) : (
                <>
                  {parts[0]}
                  <span style={{ background: color.badSubtle, color: color.bad, borderBottom: `2px solid ${color.bad}`, borderRadius: 4, padding: "1px 4px", fontWeight: 600 }}>
                    {hookAnswer.flag}
                  </span>
                  {parts[1]}
                </>
              )}
              <ScannerSweep start={scanAt} dur={sec(1.0)} />
            </div>
          </div>

          {/* evidence card contradicting the answer */}
          {frame >= eviAt && (
            <div
              style={{
                alignSelf: "flex-start",
                maxWidth: "70%",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                padding: "16px 20px",
                borderRadius: 14,
                background: "rgba(255,255,255,0.02)",
                border: `1px solid ${color.border}`,
                ...reveal(frame, eviAt, 18),
              }}
            >
              <span style={{ fontFamily: font.mono, fontSize: 13, color: color.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>Calendar evidence</span>
              <span style={{ fontFamily: font.sans, fontSize: 22, color: color.text }}>{hookEvidence}</span>
            </div>
          )}
        </div>
      </ProductFrame>

      {/* FALSE CONFIRMATION stamp */}
      {frame >= stampAt && (
        <div
          style={{
            position: "absolute",
            top: "30%",
            right: "16%",
            transform: `rotate(${stampRot}deg) scale(${0.85 + stampP * 0.15})`,
            opacity: stampP,
            padding: "12px 26px",
            border: `3px solid ${color.bad}`,
            borderRadius: 10,
            background: "rgba(239,68,68,0.08)",
            boxShadow: `0 0 50px ${color.badGlow}`,
          }}
        >
          <span style={{ fontFamily: font.sans, fontSize: 34, fontWeight: 800, letterSpacing: 2, color: color.bad, textTransform: "uppercase" }}>
            {hookFailure}
          </span>
        </div>
      )}

      <GlitchOverlay start={flagAt - 3} dur={9} />
    </FilmShell>
  );
};
