import React from "react";
import { useCurrentFrame } from "remotion";
import { color, font, sec } from "../../theme";
import { AlertCard } from "../../components/AlertCard";
import { FilmShell } from "./FilmShell";
import { reveal } from "../../components/anim";
import { problemAlerts } from "../../data-film";

// Three failure alerts drop in; headline "Confidence is not quality." ~7s.
export const S2Problem: React.FC<{ audio?: boolean }> = ({ audio }) => {
  const frame = useCurrentFrame();
  return (
    <FilmShell scene="problem" audio={audio} glow="bad" pad="120px 280px">
      <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 26 }}>
        <div style={{ ...reveal(frame, sec(0.3), 18) }}>
          <span style={{ fontFamily: font.sans, fontSize: 30, fontWeight: 600, color: color.textSecondary }}>
            Confidence is not <span style={{ color: color.text }}>quality</span>.
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {problemAlerts.map((a, i) => (
            <AlertCard key={a.kind} kind={a.kind} detail={a.detail} severity={a.severity as "high" | "med"} at={sec(0.9) + i * sec(0.9)} />
          ))}
        </div>
      </div>
    </FilmShell>
  );
};
