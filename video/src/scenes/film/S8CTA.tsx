import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { color, font, sec } from "../../theme";
import { FilmShell } from "./FilmShell";
import { reveal, rise } from "../../components/anim";
import { cta } from "../../data-film";

// Final slogan + capability chips. ~5s.
export const S8CTA: React.FC<{ audio?: boolean }> = ({ audio }) => {
  const frame = useCurrentFrame();
  const mark = rise(frame, sec(0.2));
  return (
    <FilmShell scene="cta" audio={audio}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 78,
              height: 78,
              borderRadius: 20,
              background: `linear-gradient(160deg, ${color.accentBright}, ${color.accentDeep})`,
              boxShadow: `0 0 70px ${color.accentGlow}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${mark})`,
              marginBottom: 10,
            }}
          >
            <span style={{ fontFamily: font.sans, fontSize: 40, fontWeight: 800, color: "#fff" }}>✓</span>
          </div>
          <span style={{ fontFamily: font.sans, fontSize: 30, fontWeight: 600, color: color.textSecondary, ...reveal(frame, sec(0.5), 16) }}>{cta.name}</span>
          {/* secondary formula — segments light up one by one */}
          <div style={{ display: "flex", gap: 14, marginTop: 4 }}>
            {cta.formula.trim().split(/(?<=\.)\s+/).map((seg, i) => {
              const at = sec(0.8) + i * 7;
              const lit = frame >= at;
              return (
                <span key={seg} style={{ fontFamily: font.mono, fontSize: 19, letterSpacing: 0.4, transition: "all 0.3s", ...reveal(frame, at, 10), color: lit ? color.accentBright : color.textMuted }}>
                  {seg}
                </span>
              );
            })}
          </div>
          <h1 style={{ margin: "10px 0 0", fontFamily: font.sans, fontSize: 60, fontWeight: 700, letterSpacing: -1.6, lineHeight: 1.1, color: color.text, ...reveal(frame, sec(1.6), 22) }}>
            Evaluate AI with evidence,
            <br />
            <span style={{ color: color.accentBright }}>not vibes.</span>
          </h1>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", maxWidth: 760, marginTop: 18, ...reveal(frame, sec(2.6), 16) }}>
            {cta.chips.map((c) => (
              <span key={c} style={{ fontFamily: font.mono, fontSize: 16, color: color.textSecondary, border: `1px solid ${color.border}`, background: "rgba(255,255,255,0.02)", padding: "7px 14px", borderRadius: 99 }}>
                {c}
              </span>
            ))}
          </div>
          <span style={{ fontFamily: font.sans, fontSize: 20, color: color.textMuted, marginTop: 18, ...reveal(frame, sec(3.2), 14) }}>{cta.author}</span>
        </div>
      </AbsoluteFill>
    </FilmShell>
  );
};
