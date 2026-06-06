import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, interpolate, Easing } from "remotion";
import { color, font, sec } from "../../theme";
import { Backdrop } from "../../components/Backdrop";
import { AssetBg } from "../../components/AssetBg";
import { Grain } from "../../components/Grain";
import { LightSweep } from "../../components/Atmosphere";
import { KineticType } from "../../components/KineticType";
import { GlitchOverlay } from "../../components/GlitchOverlay";
import { rise } from "../../components/anim";
import { USE_GENERATED_ASSETS } from "./FilmShell";

// Cold open — grabs attention in the first second: huge claim slams in over
// the ironic robots-café footage, then glitches into the story. ~2s.
export const S0ColdOpen: React.FC<{ audio?: boolean }> = ({ audio }) => {
  const frame = useCurrentFrame();
  const flash = interpolate(frame, [sec(1.3), sec(1.5)], [0, 0.5], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const out = interpolate(frame, [sec(1.5), sec(1.9)], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const kick = 1 + rise(frame, 0) * 0.0; // hold

  return (
    <AbsoluteFill style={{ background: color.bgBase, opacity: out }}>
      <Backdrop glow="bad" />
      <AssetBg src="video/generated/hook-robots.mp4" video enabled={USE_GENERATED_ASSETS} opacity={0.4} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "0 120px", transform: `scale(${kick})` }}>
        <KineticType
          start={2}
          step={5}
          words={[
            { text: "AI", size: 150, weight: 800 },
            { text: "can", size: 92, weight: 400, italic: true, color: color.textSecondary },
            { text: "LIE", size: 190, weight: 900 },
            { text: "beautifully.", size: 110, weight: 700, italic: true, color: color.accentBright },
          ]}
        />
      </AbsoluteFill>
      <LightSweep delay={4} />
      {audio && (
        <Sequence from={sec(1.2)}>
          <Audio src={staticFile("audio/sfx/thump.mp3")} volume={0.9} />
        </Sequence>
      )}
      <GlitchOverlay start={sec(1.25)} dur={14} />
      <AbsoluteFill style={{ background: color.bad, opacity: flash, mixBlendMode: "screen", pointerEvents: "none" }} />
      <Grain opacity={0.06} />
    </AbsoluteFill>
  );
};
