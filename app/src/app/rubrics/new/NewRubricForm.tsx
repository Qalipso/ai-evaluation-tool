"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui";
import type { Project } from "@/lib/data";
import { createRubric } from "../actions";

const METHODS = ["deterministic", "llm_judge", "semantic_similarity", "claim_pipeline", "human"];
const METHOD_LABELS: Record<string, string> = {
  deterministic: "Deterministic",
  llm_judge: "LLM Judge",
  semantic_similarity: "Semantic",
  claim_pipeline: "Claim Pipeline",
  human: "Human",
};
const METHOD_DESCRIPTIONS: Record<string, string> = {
  deterministic: "Exact match, regex, or schema validation. Zero LLM cost. Best for structured outputs (JSON schema, format checks, citation presence).",
  llm_judge: "GPT-as-evaluator: scores 0–100 via a rubric-prompted LLM (G-Eval pattern). Broad coverage, handles nuance. Moderate cost per case.",
  semantic_similarity: "Cosine similarity between output and reference embeddings. Measures semantic closeness without exact wording. Requires a reference answer.",
  claim_pipeline: "Extracts atomic factual claims from output, then verifies each against source docs via NLI. Gold standard for RAG hallucination detection (RAGAS / TruLens pattern).",
  human: "Manual annotation by a reviewer. Ground truth for ambiguous or high-stakes cases. Use on audit samples, not every run.",
};

type DimRow = { id: string; name: string; method: string; weight: number; threshold: number };

const DEFAULT_DIMS: DimRow[] = [
  { id: "accuracy", name: "Accuracy", method: "llm_judge", weight: 0.25, threshold: 0.75 },
  { id: "completeness", name: "Completeness", method: "llm_judge", weight: 0.25, threshold: 0.7 },
  { id: "hallucination_risk", name: "Hallucination risk", method: "claim_pipeline", weight: 0.25, threshold: 0.8 },
  { id: "tone_fit", name: "Tone fit", method: "llm_judge", weight: 0.25, threshold: 0.7 },
];

function InfoTip({ text }: { text: string }) {
  return (
    <span className="relative inline-flex items-center group/tip ml-1 align-middle">
      <span className="text-[10px] leading-none w-3.5 h-3.5 flex items-center justify-center rounded-full border border-text-muted text-text-muted cursor-help select-none">?</span>
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-52 px-2.5 py-2 bg-bg-hover border border-border-subtle rounded-md text-[11px] text-text-secondary leading-snug opacity-0 group-hover/tip:opacity-100 pointer-events-none z-20 whitespace-normal transition-opacity shadow-lg">
        {text}
      </span>
    </span>
  );
}

export function NewRubricForm({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [dims, setDims] = useState<DimRow[]>(DEFAULT_DIMS);

  const weightSum = dims.reduce((s, d) => s + (Number(d.weight) || 0), 0);
  const weightOk = Math.abs(weightSum - 1) < 0.001;

  function addDim() {
    setDims((prev) => [
      ...prev,
      { id: `dim_${Date.now()}`, name: "", method: "llm_judge", weight: 0, threshold: 0.7 },
    ]);
  }

  function removeDim(i: number) {
    setDims((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateDim(i: number, field: keyof DimRow, value: string | number) {
    setDims((prev) => prev.map((d, idx) => idx === i ? { ...d, [field]: value } : d));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    dims.forEach((d, i) => {
      fd.set(`dim_id_${i}`, d.id);
      fd.set(`dim_name_${i}`, d.name);
      fd.set(`dim_method_${i}`, d.method);
      fd.set(`dim_weight_${i}`, String(d.weight));
      fd.set(`dim_threshold_${i}`, String(d.threshold));
    });
    startTransition(async () => {
      try {
        await createRubric(fd);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    });
  }

  return (
    <Card className="p-5">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="px-3 py-2 bg-bad/10 border border-bad/30 rounded-md text-sm text-bad">{error}</div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Rubric ID" name="id" placeholder="my-rubric-v1.0" required mono
            tooltip="Unique slug used in project references and API calls. Use kebab-case with version suffix, e.g. rag-qa-v2.0."
          />
          <Field
            label="Version" name="version" placeholder="1.0" required mono
            tooltip="Semantic version string. Increment on any dimension or weight change to keep history traceable."
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Name" name="name" placeholder="My Eval Rubric" required
            tooltip="Human-readable display name shown in lists and reports."
          />
          <Field
            label="Owner" name="owner" placeholder="platform-team" required
            tooltip="Team or person responsible for maintaining this rubric and reviewing its results."
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">
            Project
            <InfoTip text="Project this rubric evaluates. A rubric can be reused across versions of the same project." />
          </label>
          <select
            name="project_id"
            className="w-full px-3 py-2 bg-bg-panel border border-border-subtle rounded-md text-sm focus:outline-none focus:border-brand"
          >
            <option value="">— none —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <Field
          label="Safety gates (comma-separated)"
          name="safety_gates"
          placeholder="pii_leakage, false_confirmation"
          tooltip="Hard-blocker gate IDs. If any gate triggers, the run is blocked regardless of weighted score. Common: pii_leakage, false_confirmation, medical_advice_without_disclaimer."
        />

        {/* Dimensions */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Dimensions</span>
              <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${weightOk ? "bg-ok/10 text-ok" : "bg-warn/10 text-warn"}`}>
                Σ = {weightSum.toFixed(2)} {weightOk ? "✓" : "(should be 1.00)"}
              </span>
            </div>
            <button
              type="button"
              onClick={addDim}
              className="flex items-center gap-1 text-xs text-brand hover:text-brand-hover px-2 py-1 rounded hover:bg-brand/10 transition-colors"
            >
              <Plus size={12} /> Add dimension
            </button>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 text-[10px] uppercase text-text-muted px-1">
              <div className="col-span-3" title="Human-readable label shown in reports and the UI.">Name</div>
              <div className="col-span-2" title="Snake_case identifier used in scoring APIs and data exports.">ID</div>
              <div className="col-span-3" title="Scoring method applied to this dimension. Hover each select for details.">Method</div>
              <div className="col-span-1 text-right" title="Fraction of total score (0–1). All weights must sum to 1.00.">Weight</div>
              <div className="col-span-2 text-right" title="Minimum score (0–100) for this dimension to count as passing.">Threshold</div>
              <div className="col-span-1" />
            </div>
            {dims.map((d, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <input
                  className="col-span-3 px-2 py-1.5 text-xs bg-bg-panel border border-border-subtle rounded focus:outline-none focus:border-brand"
                  placeholder="Dimension name"
                  title="Human-readable label shown in reports and the UI."
                  value={d.name}
                  onChange={(e) => updateDim(i, "name", e.target.value)}
                />
                <input
                  className="col-span-2 px-2 py-1.5 text-xs font-mono bg-bg-panel border border-border-subtle rounded focus:outline-none focus:border-brand"
                  placeholder="dim_id"
                  title="Snake_case identifier used in scoring APIs and data exports. Must be unique within this rubric."
                  value={d.id}
                  onChange={(e) => updateDim(i, "id", e.target.value)}
                />
                <select
                  className="col-span-3 px-2 py-1.5 text-xs bg-bg-panel border border-border-subtle rounded focus:outline-none focus:border-brand"
                  title={METHOD_DESCRIPTIONS[d.method]}
                  value={d.method}
                  onChange={(e) => updateDim(i, "method", e.target.value)}
                >
                  {METHODS.map((m) => (
                    <option key={m} value={m} title={METHOD_DESCRIPTIONS[m]}>{METHOD_LABELS[m]}</option>
                  ))}
                </select>
                <input
                  type="number" step="0.01" min="0" max="1"
                  title="Fraction of total score (0–1). All weights must sum to 1.00."
                  className="col-span-1 px-2 py-1.5 text-xs font-mono text-right bg-bg-panel border border-border-subtle rounded focus:outline-none focus:border-brand"
                  value={d.weight}
                  onChange={(e) => updateDim(i, "weight", parseFloat(e.target.value) || 0)}
                />
                <input
                  type="number" min="0" max="1" step="0.05"
                  title="Minimum score (0–1) for this dimension to count as passing. Cases below this threshold are flagged."
                  className="col-span-2 px-2 py-1.5 text-xs font-mono text-right bg-bg-panel border border-border-subtle rounded focus:outline-none focus:border-brand"
                  value={d.threshold}
                  onChange={(e) => updateDim(i, "threshold", parseFloat(e.target.value) || 0)}
                />
                <button
                  type="button"
                  onClick={() => removeDim(i)}
                  className="col-span-1 flex justify-center text-text-muted hover:text-bad transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="px-4 py-2 bg-brand hover:bg-brand-hover disabled:opacity-50 rounded-md text-sm font-medium transition-colors"
          >
            {pending ? "Creating…" : "Create rubric"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/rubrics")}
            className="px-4 py-2 border border-border-subtle hover:bg-bg-hover rounded-md text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </Card>
  );
}

function Field({
  label, name, defaultValue, required, placeholder, mono, tooltip,
}: {
  label: string; name: string; defaultValue?: string;
  required?: boolean; placeholder?: string; mono?: boolean; tooltip?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-text-muted mb-1">
        {label}{required && <span className="text-bad ml-0.5">*</span>}
        {tooltip && <InfoTip text={tooltip} />}
      </label>
      <input
        name={name}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        className={`w-full px-3 py-2 bg-bg-panel border border-border-subtle rounded-md text-sm focus:outline-none focus:border-brand transition-colors ${mono ? "font-mono" : ""}`}
      />
    </div>
  );
}
