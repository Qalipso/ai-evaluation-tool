import React from "react";
import { useCurrentFrame } from "remotion";
import { color, font } from "../theme";
import { reveal } from "./anim";

// Lower-third narration caption. Word-by-word reveal keyed to a per-scene
// duration so it tracks the TTS line. Always present as an accessibility/
// silent-fallback layer beneath the voiceover.
export const Caption: React.FC<{
  text: string;
  start?: number;
  durationInFrames: number;
}> = ({ text, start = 0, durationInFrames }) => {
  const frame = useCurrentFrame();
  const words = text.split(" ");
  const local = frame - start;
  const revealWindow = durationInFrames * 0.7;
  const shownCount = Math.ceil((local / revealWindow) * words.length);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 72,
        display: "flex",
        justifyContent: "center",
        padding: "0 16%",
        ...reveal(frame, start + 4, 16),
      }}
    >
      <p
        style={{
          margin: 0,
          textAlign: "center",
          fontFamily: font.sans,
          fontSize: 30,
          lineHeight: 1.45,
          fontWeight: 500,
          letterSpacing: -0.2,
          textShadow: "0 4px 30px rgba(0,0,0,0.9)",
        }}
      >
        {words.map((w, i) => (
          <span key={i} style={{ color: i < shownCount ? color.text : color.textMuted, transition: "color 0.2s", opacity: i < shownCount ? 1 : 0.5 }}>
            {w}{" "}
          </span>
        ))}
      </p>
    </div>
  );
};
