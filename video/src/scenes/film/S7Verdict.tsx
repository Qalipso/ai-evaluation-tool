import React from "react";
import { useCurrentFrame } from "remotion";
import { color, font, sec } from "../../theme";
import { ProductFrame } from "../../components/ProductFrame";
import { VerdictBadge } from "../../components/VerdictBadge";
import { MetricCard } from "../../components/MetricCard";
import { RubricBars } from "../../components/RubricBars";
import { FilmShell } from "./FilmShell";
import { reveal } from "../../components/anim";
import { verdict } from "../../data-film";

// The re-run: ship-ready verdict, KPIs, score bars. ~7s.
export const S7Verdict: React.FC<{ audio?: boolean }> = ({ audio }) => {
  const frame = useCurrentFrame();
  const rows = verdict.bars.map((b) => ({ name: b.name, method: "LLM Judge" as const, score: b.v, passed: true }));
  return (
    <FilmShell scene="verdict" audio={audio} pad="80px 180px 150px">
      <ProductFrame title="runs / areamosa · run #319 (re-evaluated)" badge={{ text: "Ship-ready", tone: "ok" }}>
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 26, justifyContent: "center" }}>
          <div style={{ ...reveal(frame, sec(0.2), 16) }}>
            <VerdictBadge label={verdict.label} score={verdict.score} at={sec(0.3)} />
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            {verdict.metrics.map((m, i) => (
              <MetricCard key={m.k} label={m.k} value={m.v} at={sec(1.0) + i * 6} tone={i === 0 ? "ok" : "muted"} />
            ))}
          </div>
          <div style={{ marginTop: 6 }}>
            <RubricBars rows={rows} start={sec(1.8)} step={6} />
          </div>
        </div>
      </ProductFrame>
    </FilmShell>
  );
};
