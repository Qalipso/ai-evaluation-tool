import React from "react";
import { useCurrentFrame } from "remotion";
import { color, font } from "../theme";
import { reveal } from "./anim";

// Section eyebrow + headline used at the top of dashboard scenes. The accent
// word can be highlighted via `{highlight}`.
export const SceneTitle: React.FC<{
  eyebrow?: string;
  title: string;
  highlight?: string;
  at?: number;
}> = ({ eyebrow, title, highlight, at = 0 }) => {
  const frame = useCurrentFrame();
  const parts = highlight ? title.split(highlight) : [title];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...reveal(frame, at, 14) }}>
      {eyebrow && (
        <span style={{ fontFamily: font.mono, fontSize: 14, color: color.accent, letterSpacing: 1.4, textTransform: "uppercase" }}>{eyebrow}</span>
      )}
      <span style={{ fontFamily: font.sans, fontSize: 28, fontWeight: 600, color: color.text }}>
        {parts[0]}
        {highlight && <span style={{ color: color.accentBright }}>{highlight}</span>}
        {parts[1]}
      </span>
    </div>
  );
};
