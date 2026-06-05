import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Audio, staticFile, useVideoConfig } from "remotion";
import { color, font, sec } from "../theme";
import { Backdrop } from "../components/Backdrop";
import { ProductFrame } from "../components/ProductFrame";
import { ChatSimulation } from "../components/ChatSimulation";
import { GlitchOverlay } from "../components/GlitchOverlay";
import { Caption } from "../components/Caption";
import { reveal, rise } from "../components/anim";
import { hookChat, hookViolation } from "../data";
import { narration } from "../narration";

// Beat: a polished agent answers perfectly -> glitch -> red policy-violation
// overlay -> hard-cut thesis line. ~8s.
export const HookScene: React.FC<{ audio?: boolean }> = ({ audio }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const violAt = sec(4.3);
  const thesisAt = sec(5.6);
  const showViolation = frame >= violAt;
  const glow = showViolation ? "bad" : "accent";

  // thesis card fades the product back
  const dim = interpolate(frame, [thesisAt - 6, thesisAt + 8], [1, 0.12], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <Backdrop glow={glow} />
      {audio && <Audio src={staticFile(narration.hook.audio)} />}

      <AbsoluteFill style={{ padding: "90px 220px", opacity: dim }}>
        <ProductFrame
          title="customer-support-agent · demo"
          badge={showViolation ? { text: hookViolation.title, tone: "bad" } : { text: "live", tone: "ok" }}
        >
          <div style={{ width: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 26 }}>
            <ChatSimulation turns={hookChat} start={sec(0.4)} cps={34} />
            {showViolation && (
              <div
                style={{
                  ...reveal(frame, violAt, 18),
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "16px 20px",
                  borderRadius: 12,
                  background: color.badSubtle,
                  border: `1px solid ${color.bad}55`,
                  boxShadow: `0 0 40px ${color.badGlow}`,
                }}
              >
                <span style={{ width: 11, height: 11, borderRadius: 99, background: color.bad, boxShadow: `0 0 12px ${color.bad}` }} />
                <span style={{ fontFamily: font.mono, fontSize: 20, color: color.bad, fontWeight: 600 }}>{hookViolation.title}</span>
                <span style={{ fontFamily: font.mono, fontSize: 16, color: color.textSecondary }}>{hookViolation.detail}</span>
              </div>
            )}
          </div>
        </ProductFrame>
      </AbsoluteFill>

      <GlitchOverlay start={violAt - 4} dur={10} />

      {/* thesis line */}
      {frame >= thesisAt && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", ...reveal(frame, thesisAt, 26) }}>
            <p style={{ margin: 0, fontFamily: font.sans, fontSize: 64, fontWeight: 700, color: color.text, letterSpacing: -1.5, lineHeight: 1.08 }}>
              AI works in demos.
            </p>
            <p style={{ margin: "6px 0 0", fontFamily: font.sans, fontSize: 64, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1.08, color: color.bad, opacity: rise(frame, thesisAt + 8) }}>
              It breaks in the edge cases.
            </p>
          </div>
        </AbsoluteFill>
      )}

      <Caption text={narration.hook.text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
