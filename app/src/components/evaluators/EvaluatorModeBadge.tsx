import { Cpu } from "lucide-react";

// Honest mode badge. These two evaluators run locally (pattern-based, no LLM).
// We only mention providers as available context, never claim they are running.
export function EvaluatorModeBadge({ llm, supabase }: { llm: boolean; supabase: boolean }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-bg-card px-3 py-1 text-[11px] text-text-secondary">
      <Cpu size={12} className="text-brand" />
      <span className="font-medium">Local evaluator mode</span>
      <span className="text-text-muted">· pattern-based, no LLM call</span>
      <span className="text-text-muted">
        · providers: OpenAI {llm ? "✓" : "—"} · Supabase {supabase ? "✓" : "—"}
      </span>
    </div>
  );
}
