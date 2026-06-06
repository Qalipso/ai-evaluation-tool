import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { wipe } from "@remotion/transitions/wipe";
import { fade } from "@remotion/transitions/fade";
import { color, font, sec } from "./theme";
import { Backdrop } from "./components/Backdrop";
import { Grain } from "./components/Grain";
import { KineticType } from "./components/KineticType";
import { PipelineFlow } from "./components/PipelineFlow";
import { ScoreDial } from "./components/ScoreDial";
import { GlitchOverlay } from "./components/GlitchOverlay";
import { reveal, rise } from "./components/anim";
import { filmClaims } from "./data-film";

const Beat: React.FC<{ glow?: "accent" | "bad"; children: React.ReactNode }> = ({ glow = "accent", children }) => (
  <AbsoluteFill>
    <Backdrop glow={glow} />
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "0 120px" }}>{children}</AbsoluteFill>
    <Grain opacity={0.05} />
  </AbsoluteFill>
);

// 1 — Hook: confident lie flagged
const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const stamp = rise(f, sec(0.9));
  return (
    <Beat glow={f >= sec(0.9) ? "bad" : "accent"}>
      <KineticType start={2} step={6} align="center" words={[
        { text: "AI", size: 120, weight: 800 },
        { text: "can", size: 80, weight: 400, italic: true, color: color.textSecondary },
        { text: "LIE", size: 150, weight: 900, color: color.text },
        { text: "beautifully.", size: 96, weight: 700, italic: true, color: color.accentBright },
      ]} />
      {f >= sec(0.9) && (
        <div style={{ position: "absolute", bottom: "22%", transform: `rotate(-7deg) scale(${0.85 + stamp * 0.15})`, opacity: stamp, padding: "10px 24px", border: `3px solid ${color.bad}`, borderRadius: 10, background: "rgba(239,68,68,0.08)", boxShadow: `0 0 50px ${color.badGlow}` }}>
          <span style={{ fontFamily: font.sans, fontSize: 32, fontWeight: 800, letterSpacing: 2, color: color.bad }}>FALSE CONFIRMATION</span>
        </div>
      )}
      <GlitchOverlay start={sec(0.7)} dur={9} />
    </Beat>
  );
};

// 2 — Claims grounded against evidence
const labelColor = { contradicted: color.bad, unsupported: color.bad, partial: color.warn, supported: color.ok } as const;
const Claims: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Beat>
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 30 }}>
        <span style={{ fontFamily: font.sans, fontSize: 40, fontWeight: 700, color: color.text, textAlign: "center" }}>
          Every claim <span style={{ color: color.accentBright }}>checked against evidence</span>
        </span>
        <PipelineFlow steps={["Answer", "Claims", "Evidence", "Score", "Verdict"]} start={sec(0.2)} step={6} />
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 6 }}>
          {filmClaims.slice(0, 3).map((c, i) => {
            const at = sec(0.9) + i * 9;
            if (f < at) return null;
            const cc = labelColor[c.label];
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, ...reveal(f, at, 16) }}>
                <span style={{ width: 9, height: 9, borderRadius: 99, background: cc, boxShadow: `0 0 10px ${cc}` }} />
                <span style={{ flex: 1, fontFamily: font.mono, fontSize: 20, color: color.textSecondary }}>"{c.text}"</span>
                <span style={{ fontFamily: font.mono, fontSize: 16, color: cc, border: `1px solid ${cc}44`, background: `${cc}14`, padding: "4px 12px", borderRadius: 7, textTransform: "uppercase" }}>{c.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Beat>
  );
};

// 3 — Safety: blocked then pass
const Safety: React.FC = () => {
  const f = useCurrentFrame();
  const pass = f >= sec(1.1);
  return (
    <Beat glow={pass ? "accent" : "bad"}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <span style={{ fontFamily: font.mono, fontSize: 22, color: color.textMuted, letterSpacing: 2, textTransform: "uppercase" }}>Safety gates</span>
        <KineticType start={2} step={6} words={pass
          ? [{ text: "RISKS", size: 120, weight: 800, color: color.textSecondary }, { text: "BLOCKED.", size: 140, weight: 900, color: color.ok }]
          : [{ text: "RISKS", size: 120, weight: 800, color: color.textSecondary }, { text: "CAUGHT.", size: 140, weight: 900, color: color.bad }]
        } />
      </div>
    </Beat>
  );
};

// 4 — Verdict dial
const Verdict: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Beat>
      <div style={{ display: "flex", alignItems: "center", gap: 50 }}>
        <ScoreDial value={94} start={4} size={300} />
        <div style={{ ...reveal(f, sec(0.6), 18) }}>
          <div style={{ fontFamily: font.sans, fontSize: 64, fontWeight: 800, color: color.ok }}>Ship-ready</div>
          <div style={{ fontFamily: font.mono, fontSize: 24, color: color.textMuted, marginTop: 6 }}>100% pass · 0 findings · 9 claims</div>
        </div>
      </div>
    </Beat>
  );
};

// 5 — CTA slogan
const CTA: React.FC = () => (
  <Beat>
    <KineticType start={2} step={5} words={[
      { text: "Evaluate", size: 92, weight: 700 },
      { text: "AI", size: 92, weight: 800 },
      { text: "with", size: 58, weight: 400, italic: true, color: color.textSecondary },
      { text: "EVIDENCE,", size: 104, weight: 900, color: color.accentBright, track: -3 },
      { text: "not", size: 60, weight: 400, italic: true, color: color.textSecondary },
      { text: "vibes.", size: 104, weight: 900 },
    ]} />
  </Beat>
);

const beats: { c: React.FC; dur: number }[] = [
  { c: Hook, dur: sec(2.4) },
  { c: Claims, dur: sec(3.4) },
  { c: Safety, dur: sec(2.2) },
  { c: Verdict, dur: sec(2.8) },
  { c: CTA, dur: sec(3.0) },
];

const TX = 10;

export const Teaser: React.FC = () => (
  <AbsoluteFill style={{ background: color.bgBase }}>
    <TransitionSeries>
      {beats.map(({ c: C, dur }, i) => (
        <React.Fragment key={i}>
          <TransitionSeries.Sequence durationInFrames={dur}>
            <PunchIn>
              <C />
            </PunchIn>
          </TransitionSeries.Sequence>
          {i < beats.length - 1 && (
            <TransitionSeries.Transition
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              presentation={(i % 2 === 0 ? wipe({ direction: "from-left" }) : fade()) as any}
              timing={linearTiming({ durationInFrames: TX })}
            />
          )}
        </React.Fragment>
      ))}
    </TransitionSeries>
  </AbsoluteFill>
);

const PunchIn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  const s = interpolate(f, [0, 6], [1.04, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return <AbsoluteFill style={{ transform: `scale(${s})` }}>{children}</AbsoluteFill>;
};

export const TEASER_FRAMES = beats.reduce((a, b) => a + b.dur, 0) - (beats.length - 1) * TX;
