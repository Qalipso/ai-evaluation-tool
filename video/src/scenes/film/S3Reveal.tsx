import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { color, font, sec } from "../../theme";
import { FilmShell } from "./FilmShell";
import { Deliberation } from "../../components/Deliberation";
import { reveal, rise } from "../../components/anim";
import { product } from "../../data-film";

// Product name reveal with a soft logo glow. ~7s.
export const S3Reveal: React.FC<{ audio?: boolean }> = ({ audio }) => {
  const frame = useCurrentFrame();
  const mark = rise(frame, sec(0.2));
  return (
    <FilmShell scene="reveal" audio={audio}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 92,
              height: 92,
              borderRadius: 24,
              background: `linear-gradient(160deg, ${color.accentBright}, ${color.accentDeep})`,
              boxShadow: `0 0 70px ${color.accentGlow}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${mark})`,
              marginBottom: 14,
            }}
          >
            <span style={{ fontFamily: font.sans, fontSize: 46, fontWeight: 800, color: "#fff" }}>✓</span>
          </div>
          <h1 style={{ margin: 0, fontFamily: font.sans, fontSize: 74, fontWeight: 700, letterSpacing: -2, color: color.text, ...reveal(frame, sec(0.5), 22) }}>
            {product.name}
          </h1>
          <p style={{ margin: 0, fontFamily: font.sans, fontSize: 30, color: color.accentBright, fontWeight: 500, ...reveal(frame, sec(1.1), 18) }}>
            {product.tagline}
          </p>
          <p style={{ margin: "10px 0 0", fontFamily: font.sans, fontSize: 22, color: color.textSecondary, ...reveal(frame, sec(1.7), 16) }}>
            {product.sub}
          </p>
          <div style={{ marginTop: 22 }}>
            <Deliberation label="Initializing" start={sec(2.6)} thoughts={["loading rubric v3", "calibrating judges", "arming safety gates", "ready to evaluate"]} />
          </div>
        </div>
      </AbsoluteFill>
    </FilmShell>
  );
};
