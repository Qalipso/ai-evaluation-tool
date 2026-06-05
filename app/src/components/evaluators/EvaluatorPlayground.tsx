"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import type { ToolTraceLite, SupportedLanguage } from "@/lib/evaluators/types";
import { EMPTY_TRACE } from "@/lib/evaluators/types";
import { DEMO_EXAMPLES } from "@/lib/evaluators/mockData";
import { EvaluatorModeBadge } from "./EvaluatorModeBadge";
import { ClaimPipelinePanel } from "./ClaimPipelinePanel";
import { DeterministicChecksPanel } from "./DeterministicChecksPanel";

export interface SharedInputs {
  agentOutput: string;
  contextText: string;
  expectedBehavior: string;
  expectedLanguage: SupportedLanguage;
  trace: ToolTraceLite;
}

export function EvaluatorPlayground({ llm, supabase }: { llm: boolean; supabase: boolean }) {
  const [s, setS] = useState<SharedInputs>({
    agentOutput: "",
    contextText: "",
    expectedBehavior: "",
    expectedLanguage: "en",
    trace: { ...EMPTY_TRACE },
  });

  function loadDemo(id: string) {
    const d = DEMO_EXAMPLES.find((x) => x.id === id);
    if (!d) return;
    setS({
      agentOutput: d.agentOutput,
      contextText: d.context.join("\n"),
      expectedBehavior: d.expectedBehavior,
      expectedLanguage: d.expectedLanguage ?? "en",
      trace: { ...d.trace },
    });
  }

  const patch = (p: Partial<SharedInputs>) => setS((prev) => ({ ...prev, ...p }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <EvaluatorModeBadge llm={llm} supabase={supabase} />
      </div>

      {/* Demo examples */}
      <div className="elev-card p-4">
        <div className="flex items-center gap-2 text-xs text-text-muted mb-2.5">
          <Sparkles size={13} className="text-brand" /> Load a demo example into both evaluators
        </div>
        <div className="flex flex-wrap gap-2">
          {DEMO_EXAMPLES.map((d) => (
            <button
              key={d.id}
              onClick={() => loadDemo(d.id)}
              title={d.description}
              className="btn-pill btn-ghost px-3.5 py-1.5 text-xs"
            >
              {d.title}
            </button>
          ))}
        </div>
      </div>

      <ClaimPipelinePanel shared={s} patch={patch} />
      <DeterministicChecksPanel shared={s} patch={patch} />
    </div>
  );
}
