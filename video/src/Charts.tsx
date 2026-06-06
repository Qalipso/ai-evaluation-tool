import React from "react";
import { AbsoluteFill } from "remotion";
import { color, font } from "./theme";
import { Backdrop } from "./components/Backdrop";
import { Grain } from "./components/Grain";
import { PipelineFlow } from "./components/PipelineFlow";
import { SafetyGateGrid } from "./components/SafetyGateGrid";
import { RubricBars } from "./components/RubricBars";
import { ScoreDial } from "./components/ScoreDial";
import { safetyGates, verdict } from "./data-film";

const ChartFrame: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <AbsoluteFill style={{ background: color.bgBase }}>
    <Backdrop glow="accent" />
    <AbsoluteFill style={{ padding: "54px 64px", display: "flex", flexDirection: "column", gap: 26 }}>
      <span style={{ fontFamily: font.mono, fontSize: 18, color: color.accent, letterSpacing: 2, textTransform: "uppercase" }}>{title}</span>
      <div style={{ flex: 1, display: "flex", alignItems: "center" }}>{children}</div>
    </AbsoluteFill>
    <Grain opacity={0.05} />
  </AbsoluteFill>
);

// Animated claim pipeline strip — README loop.
export const ChartPipeline: React.FC = () => (
  <ChartFrame title="Claim pipeline">
    <PipelineFlow steps={["Answer", "Extract claims", "Retrieve evidence", "Score", "Verdict"]} start={6} step={12} />
  </ChartFrame>
);

// Safety gate grid resolving (one blocked).
export const ChartGates: React.FC = () => (
  <ChartFrame title="Safety gates">
    <div style={{ width: "100%" }}>
      <SafetyGateGrid gates={safetyGates} start={6} step={7} resolveAt={60} />
    </div>
  </ChartFrame>
);

// Rubric score bars filling.
export const ChartRubric: React.FC = () => {
  const rows = verdict.bars.map((b) => ({ name: b.name, method: "LLM Judge" as const, score: b.v, passed: true }));
  return (
    <ChartFrame title="Rubric breakdown">
      <div style={{ width: "100%" }}>
        <RubricBars rows={rows} start={6} step={8} />
      </div>
    </ChartFrame>
  );
};

// Score dial counting to ship-ready.
export const ChartScore: React.FC = () => (
  <ChartFrame title="Verdict score">
    <div style={{ display: "flex", alignItems: "center", gap: 44 }}>
      <ScoreDial value={94} start={8} size={300} />
      <div>
        <div style={{ fontFamily: font.sans, fontSize: 54, fontWeight: 800, color: color.ok }}>Ship-ready</div>
        <div style={{ fontFamily: font.mono, fontSize: 22, color: color.textMuted, marginTop: 6 }}>0.94 / 1.0 · 100% pass</div>
      </div>
    </div>
  </ChartFrame>
);
