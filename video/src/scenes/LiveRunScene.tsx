import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Audio, staticFile } from "remotion";
import { color, font, sec } from "../theme";
import { Backdrop } from "../components/Backdrop";
import { ProductFrame, Pill } from "../components/ProductFrame";
import { ChatSimulation } from "../components/ChatSimulation";
import { TraceTimeline } from "../components/TraceTimeline";
import { Caption } from "../components/Caption";
import { reveal } from "../components/anim";
import { runScenario, runChat, runTrace, runPass } from "../data";
import { narration } from "../narration";

const ScenarioPanel: React.FC<{ frame: number }> = ({ frame }) => (
  <div style={{ width: 360, flexShrink: 0, display: "flex", flexDirection: "column", gap: 16, ...reveal(frame, sec(0.3), 18) }}>
    <span style={{ fontFamily: font.mono, fontSize: 14, color: color.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>Scenario under test</span>
    <span style={{ fontFamily: font.sans, fontSize: 28, fontWeight: 600, color: color.text, lineHeight: 1.2 }}>{runScenario.name}</span>
    <div style={{ height: 1, background: color.border }} />
    {[
      ["Intent", runScenario.intent],
      ["Language", runScenario.lang],
      ["Risk", runScenario.risk],
      ["Required tool", runScenario.tool],
    ].map(([k, v]) => (
      <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: font.sans, fontSize: 18, color: color.textSecondary }}>{k}</span>
        <span style={{ fontFamily: font.mono, fontSize: 17, color: color.text }}>{v}</span>
      </div>
    ))}
    <div style={{ marginTop: 4, display: "flex", gap: 8, flexWrap: "wrap" }}>
      <Pill tone="accent">no double-booking</Pill>
      <Pill tone="accent">confirm before write</Pill>
      <Pill tone="accent">escalate if unclear</Pill>
    </div>
  </div>
);

// Beat: scenario panel + simulated ES conversation with a tool call, an
// access-control refusal, and a live decision trace -> PASS. ~13s.
export const LiveRunScene: React.FC<{ audio?: boolean }> = ({ audio }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const traceAt = sec(8.2);
  const passAt = sec(10.6);

  return (
    <AbsoluteFill>
      <Backdrop glow="accent" />
      {audio && <Audio src={staticFile(narration.liveRun.audio)} />}

      <AbsoluteFill style={{ padding: "70px 130px 150px" }}>
        <ProductFrame
          title="runs / whatsapp-booking-agent · run #318"
          badge={frame >= passAt ? { text: `${runPass.label} · ${runPass.dim}`, tone: "ok" } : { text: "running…", tone: "accent" }}
        >
          <div style={{ display: "flex", gap: 34, width: "100%" }}>
            <ScenarioPanel frame={frame} />
            <div style={{ width: 1, background: color.border }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: 0 }}>
              <ChatSimulation turns={runChat} start={sec(0.6)} cps={44} />
              {frame >= traceAt && (
                <div style={{ marginTop: 24 }}>
                  <TraceTimeline events={runTrace} start={traceAt} step={9} />
                </div>
              )}
            </div>
          </div>
        </ProductFrame>
      </AbsoluteFill>

      <Caption text={narration.liveRun.text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
