import React from "react";
import { useCurrentFrame } from "remotion";
import { color, font, sec } from "../../theme";
import { ProductFrame } from "../../components/ProductFrame";
import { GlitchOverlay } from "../../components/GlitchOverlay";
import { FilmShell } from "./FilmShell";
import { typed, reveal } from "../../components/anim";
import { hookAnswer, hookFlag, demoCase } from "../../data-film";

// Confident agent answer; one claim flagged red. ~6s.
export const S1Hook: React.FC<{ audio?: boolean }> = ({ audio }) => {
  const frame = useCurrentFrame();
  const flagAt = sec(2.6);
  const shown = typed(frame, sec(0.4), hookAnswer.text, 30);
  const flagged = frame >= flagAt;
  const parts = hookAnswer.text.split(hookAnswer.flag);

  return (
    <FilmShell scene="hook" audio={audio} glow={flagged ? "bad" : "accent"} pad="120px 240px">
      <ProductFrame
        title={`${demoCase.project} · WhatsApp`}
        badge={flagged ? { text: "Unsupported claim", tone: "bad" } : { text: "agent reply", tone: "accent" }}
      >
        <div style={{ width: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 28 }}>
          <span style={{ fontFamily: font.mono, fontSize: 14, color: color.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>Agent</span>
          <div
            style={{
              alignSelf: "flex-start",
              maxWidth: "85%",
              fontFamily: font.sans,
              fontSize: 30,
              lineHeight: 1.45,
              color: color.text,
              background: "rgba(124,108,255,0.10)",
              border: `1px solid ${color.accent}3a`,
              borderRadius: 18,
              borderTopLeftRadius: 4,
              padding: "20px 26px",
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
          </div>
          {flagged && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, ...reveal(frame, flagAt + 4, 14) }}>
              <span style={{ width: 10, height: 10, borderRadius: 99, background: color.bad, boxShadow: `0 0 12px ${color.bad}` }} />
              <span style={{ fontFamily: font.mono, fontSize: 18, color: color.bad }}>{hookFlag}</span>
            </div>
          )}
        </div>
      </ProductFrame>
      <GlitchOverlay start={flagAt - 3} dur={9} />
    </FilmShell>
  );
};
