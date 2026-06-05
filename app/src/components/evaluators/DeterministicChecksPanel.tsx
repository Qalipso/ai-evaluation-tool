"use client";

import { useState } from "react";
import { Binary, Play } from "lucide-react";
import type { CheckType, DeterministicResult, SupportedLanguage } from "@/lib/evaluators/types";
import { CHECK_META, ALL_CHECKS } from "@/lib/evaluators/safetyGates";
import { evaluateDeterministic } from "@/app/evaluators/actions";
import type { SharedInputs } from "./EvaluatorPlayground";
import { ToolTraceEditor } from "./ToolTraceEditor";
import { CheckSummaryCards } from "./CheckSummaryCards";
import { DeterministicCheckList } from "./DeterministicCheckList";
import { CheckDetailDrawer } from "./CheckDetailDrawer";
import { JsonDebugPanel } from "./JsonDebugPanel";
import { LoadingState, EmptyResultState, ErrorState } from "./states";

type Status = "idle" | "loading" | "success" | "error";
const LANGS: SupportedLanguage[] = ["en", "es", "ru", "unknown"];

export function DeterministicChecksPanel({
  shared,
  patch,
}: {
  shared: SharedInputs;
  patch: (p: Partial<SharedInputs>) => void;
}) {
  const [enabled, setEnabled] = useState<CheckType[]>([...ALL_CHECKS]);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<DeterministicResult | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggle(t: CheckType) {
    setEnabled((e) => (e.includes(t) ? e.filter((x) => x !== t) : [...e, t]));
  }

  async function run() {
    setStatus("loading");
    setError(null);
    setSelected(null);
    try {
      const res = await evaluateDeterministic({
        agentOutput: shared.agentOutput,
        expectedBehavior: shared.expectedBehavior,
        expectedLanguage: shared.expectedLanguage,
        trace: shared.trace,
        enabledChecks: enabled,
      });
      setResult(res);
      setStatus("success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checks failed");
      setStatus("error");
    }
  }

  const selectedCheck = result?.checks.find((c) => c.id === selected) ?? null;

  return (
    <section className="elev-card p-6">
      <header className="mb-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Binary size={15} className="text-brand" /> Deterministic checks
        </h2>
        <p className="text-xs text-text-muted mt-0.5">Code-based rules, no LLM. Each check is auditable.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: inputs */}
        <div className="space-y-3">
          <L label="Agent output">
            <textarea value={shared.agentOutput} onChange={(e) => patch({ agentOutput: e.target.value })} rows={4} className="input" placeholder="Paste the agent output…" />
          </L>
          <L label="Expected behavior">
            <textarea value={shared.expectedBehavior} onChange={(e) => patch({ expectedBehavior: e.target.value })} rows={2} className="input" placeholder="What a good response should do…" />
          </L>
          <L label="Expected language">
            <select value={shared.expectedLanguage} onChange={(e) => patch({ expectedLanguage: e.target.value as SupportedLanguage })} className="input">
              {LANGS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </L>
          <L label="Tool trace">
            <ToolTraceEditor value={shared.trace} onChange={(t) => patch({ trace: t })} />
          </L>
          <L label="Enabled checks">
            <div className="flex flex-wrap gap-2">
              {ALL_CHECKS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggle(t)}
                  title={CHECK_META[t].description}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                    enabled.includes(t)
                      ? "border-brand/40 bg-brand/10 text-brand"
                      : "border-border-subtle bg-bg-card text-text-muted hover:text-text-secondary"
                  }`}
                >
                  {CHECK_META[t].label}
                </button>
              ))}
            </div>
          </L>
          <button onClick={run} disabled={status === "loading" || !shared.agentOutput.trim()} className="btn-pill btn-primary inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium disabled:opacity-40">
            <Play size={13} /> {status === "loading" ? "Running…" : "Run code checks"}
          </button>
        </div>

        {/* Right: results */}
        <div className="space-y-3">
          {status === "idle" && <EmptyResultState title="No run yet" hint="Load a demo or paste output, then run checks." />}
          {status === "loading" && <LoadingState label="Running checks…" />}
          {status === "error" && error && <ErrorState message={error} />}
          {status === "success" && result && (
            <>
              <CheckSummaryCards result={result} />
              <DeterministicCheckList checks={result.checks} selectedId={selected} onSelect={setSelected} />
              <CheckDetailDrawer check={selectedCheck} />
            </>
          )}
          {result && status !== "loading" && <JsonDebugPanel data={result} title="Check result JSON" />}
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
