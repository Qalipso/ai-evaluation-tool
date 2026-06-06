import React from "react";
import { useCurrentFrame } from "remotion";
import { color, font, sec } from "../../theme";
import { KineticType } from "../../components/KineticType";
import { FilmShell } from "./FilmShell";
import { reveal } from "../../components/anim";
import { problemAlerts } from "../../data-film";

// Kinetic typographic beat — big varied words SLAM in, then failures flash as
// mono tags. Not a card slideshow. ~4s.
export const S2Problem: React.FC<{ audio?: boolean }> = ({ audio }) => {
  const frame = useCurrentFrame();
  return (
    <FilmShell scene="problem" audio={audio} glow="bad" pad="0">
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 34, padding: "0 120px" }}>
        <KineticType
          start={sec(0.1)}
          step={6}
          words={[
            { text: "CONFIDENCE", size: 150, weight: 800, color: color.textSecondary, track: -4 },
            { text: "IS", size: 90, weight: 400, italic: true, color: color.textMuted },
            { text: "NOT", size: 150, weight: 900, color: color.text },
            { text: "QUALITY", size: 168, weight: 800, color: color.bad, track: -5 },
          ]}
        />
        {/* failures flash as fast mono tags */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          {problemAlerts.map((a, i) => {
            const at = sec(1.4) + i * 6;
            if (frame < at) return null;
            return (
              <span
                key={a.kind}
                style={{
                  fontFamily: font.mono,
                  fontSize: 22,
                  color: color.bad,
                  border: `1px solid ${color.bad}55`,
                  background: color.badSubtle,
                  padding: "8px 18px",
                  borderRadius: 8,
                  ...reveal(frame, at, 20),
                }}
              >
                {a.kind}
              </span>
            );
          })}
        </div>
      </div>
    </FilmShell>
  );
};
