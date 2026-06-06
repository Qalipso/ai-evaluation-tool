import React from "react";
import { useCurrentFrame, Audio, Sequence, staticFile } from "remotion";
import { color, font, sec } from "../../theme";
import { ProductFrame } from "../../components/ProductFrame";
import { VerdictBadge } from "../../components/VerdictBadge";
import { MetricCard } from "../../components/MetricCard";
import { RubricBars } from "../../components/RubricBars";
import { Deliberation } from "../../components/Deliberation";
import { FilmShell } from "./FilmShell";
import { reveal } from "../../components/anim";
import { verdict } from "../../data-film";

// The re-run: evaluator deliberates, then ship-ready verdict, KPIs, score
// bars. The verdict is weighed, not stamped. ~9s.
export const S7Verdict: React.FC<{ audio?: boolean }> = ({ audio }) => {
  const frame = useCurrentFrame();
  const rows = verdict.bars.map((b) => ({ name: b.name, method: "LLM Judge" as const, score: b.v, passed: true }));
  const badgeAt = sec(1.4);
  return (
    <FilmShell scene="verdict" audio={audio} pad="80px 180px 150px">
      {audio && (
        <Sequence from={badgeAt}>
          <Audio src={staticFile("audio/sfx/chime.mp3")} volume={0.7} />
        </Sequence>
      )}
      <ProductFrame title="runs / areamosa · run #319 (re-evaluated)" badge={frame >= badgeAt ? { text: "Ship-ready", tone: "ok" } : { text: "deliberating…", tone: "accent" }}>
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 24, justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            {frame >= badgeAt ? (
              <div style={{ ...reveal(frame, badgeAt, 16) }}>
                <VerdictBadge label={verdict.label} score={verdict.score} at={badgeAt} />
              </div>
            ) : (
              <Deliberation label="Deliberating" start={sec(0.2)} thoughts={["aggregating dimensions", "applying thresholds", "checking safety findings", "weighing verdict"]} />
            )}
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            {verdict.metrics.map((m, i) => (
              <MetricCard key={m.k} label={m.k} value={m.v} at={sec(2.2) + i * 6} tone={i === 0 ? "ok" : "muted"} />
            ))}
          </div>
          <div style={{ marginTop: 6 }}>
            <RubricBars rows={rows} start={sec(3.0)} step={6} />
          </div>
        </div>
      </ProductFrame>
    </FilmShell>
  );
};
