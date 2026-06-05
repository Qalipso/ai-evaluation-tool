import React from "react";
import { useCurrentFrame } from "remotion";
import { color, font, sec } from "../../theme";
import { ProductFrame } from "../../components/ProductFrame";
import { SafetyGateGrid } from "../../components/SafetyGateGrid";
import { FilmShell } from "./FilmShell";
import { reveal } from "../../components/anim";
import { safetyGates } from "../../data-film";

// Safety gate grid resolves; one BLOCKED. "Catch failures before users do." ~9s.
export const S6Safety: React.FC<{ audio?: boolean }> = ({ audio }) => {
  const frame = useCurrentFrame();
  const blocked = safetyGates.some((g) => g.status === "blocked");
  const resolveAt = sec(3.4);
  const glow = frame >= resolveAt && blocked ? "bad" : "accent";
  return (
    <FilmShell scene="safety" audio={audio} glow={glow} pad="80px 200px 150px" bg="video/generated/safety-gates.mp4" bgVideo>
      <ProductFrame title="safety / areamosa · gate run" badge={frame >= resolveAt ? { text: "1 blocked", tone: "bad" } : { text: "scanning…", tone: "accent" }}>
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 24, justifyContent: "center" }}>
          <span style={{ fontFamily: font.sans, fontSize: 26, fontWeight: 600, color: color.text, ...reveal(frame, sec(0.2), 12) }}>
            Catch failures <span style={{ color: color.accentBright }}>before users do</span>.
          </span>
          <SafetyGateGrid gates={safetyGates} start={sec(0.6)} step={6} resolveAt={resolveAt} />
        </div>
      </ProductFrame>
    </FilmShell>
  );
};
