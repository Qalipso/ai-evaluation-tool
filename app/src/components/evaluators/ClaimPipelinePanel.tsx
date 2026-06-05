"use client";

import { useState } from "react";
import { Network, Play } from "lucide-react";
import type { ClaimPipelineResult, EvidenceSource } from "@/lib/evaluators/types";
import { ALL_EVIDENCE_SOURCES } from "@/lib/evaluators/types";
import { evaluateClaims } from "@/app/evaluators/actions";
import type { SharedInputs } from "./EvaluatorPlayground";
import { ToolTraceEditor } from "./ToolTraceEditor";
import { EvidenceSourceSelector } from "./EvidenceSourceSelector";
import { ClaimSummaryCards } from "./ClaimSummaryCards";
import { ClaimsTable } from "./ClaimsTable";
import { ClaimDetailDrawer } from "./ClaimDetailDrawer";
import { JsonDebugPanel } from "./JsonDebugPanel";
import { LoadingState, EmptyResultState, ErrorState } from "./states";

type Status = "idle" | "loading" | "success" | "empty" | "error";

export function ClaimPipelinePanel({
  shared,
  patch,
}: {
  shared: SharedInputs;
  patch: (p: Partial<SharedInputs>) => void;
}) {
  const [sources, setSources] = useState<EvidenceSource[]>([...ALL_EVIDENCE_SOURCES]);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<ClaimPipelineResult | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setStatus("loading");
    setError(null);
    setSelected(null);
    try {
      const res = await evaluateClaims({
        agentOutput: shared.agentOutput,
        context: shared.contextText.split("\n").map((x) => x.trim()).filter(Boolean),
        trace: shared.trace,
        evidenceSources: sources,
      });
      setResult(res);
      setStatus(res.claims.length === 0 ? "empty" : "success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Evaluation failed");
      setStatus("error");
    }
  }

  const selectedClaim = result?.claims.find((c) => c.id === selected) ?? null;

  return (
    <section className="elev-card p-6">
      <header className="mb-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Network size={15} className="text-brand" /> Claim pipeline
        </h2>
        <p className="text-xs text-text-muted mt-0.5">
          Pattern-based extraction + verification against the tool trace and evidence sources.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: inputs */}
        <div className="space-y-3">
          <L label="Agent output">
            <textarea value={shared.agentOutput} onChange={(e) => patch({ agentOutput: e.target.value })} rows={4} className="input" placeholder="Paste the agent output…" />
          </L>
          <L label="Evidence / context" hint="One chunk per line.">
            <textarea value={shared.contextText} onChange={(e) => patch({ contextText: e.target.value })} rows={3} className="input" placeholder="Context the claims should be grounded in…" />
          </L>
          <L label="Tool trace" hint="Toggle booleans or paste JSON.">
            <ToolTraceEditor value={shared.trace} onChange={(t) => patch({ trace: t })} />
          </L>
          <L label="Evidence sources allowed">
            <EvidenceSourceSelector value={sources} onChange={setSources} />
          </L>
          <button onClick={run} disabled={status === "loading" || !shared.agentOutput.trim()} className="btn-pill btn-primary inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium disabled:opacity-40">
            <Play size={13} /> {status === "loading" ? "Extracting…" : "Extract & verify claims"}
          </button>
        </div>

        {/* Right: results */}
        <div className="space-y-3">
          {status === "idle" && <EmptyResultState title="No run yet" hint="Load a demo or paste output, then extract claims." />}
          {status === "loading" && <LoadingState label="Extracting & verifying…" />}
          {status === "error" && error && <ErrorState message={error} />}
          {status === "empty" && <EmptyResultState title="No claims found" hint="No booking, availability, handoff, capability, or PII patterns matched." />}
          {status === "success" && result && (
            <>
              <ClaimSummaryCards summary={result.summary} />
              <ClaimsTable claims={result.claims} selectedId={selected} onSelect={setSelected} />
              <ClaimDetailDrawer claim={selectedClaim} />
            </>
          )}
          {result && status !== "loading" && <JsonDebugPanel data={result} title="Claim result JSON" />}
        </div>
      </div>
    </section>
  );
}

function L({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[13px] font-medium text-text-secondary tracking-wide">{label}</span>
      {hint && <span className="block text-xs text-text-muted">{hint}</span>}
      {children}
    </label>
  );
}
