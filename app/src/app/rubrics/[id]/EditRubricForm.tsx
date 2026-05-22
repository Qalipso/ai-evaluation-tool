"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui";
import type { Rubric, Dimension, Project } from "@/lib/data";
import { updateRubric } from "../actions";

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

export function EditRubricForm({ rubric, projects }: { rubric: Rubric; projects: Project[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dims, setDims] = useState<Dimension[]>(rubric.dimensions);

  const weightSum = dims.reduce((s, d) => s + (Number(d.weight) || 0), 0);
  const weightOk = Math.abs(weightSum - 1) < 0.001;

  function addDim() {
    setDims((prev) => [
      ...prev,
      { id: `dim_${Date.now()}`, name: "", method: "llm_judge", weight: 0, threshold: 70 },
    ]);
  }

  function removeDim(i: number) {
    setDims((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateDim(i: number, field: keyof Dimension, value: string | number) {
    setDims((prev) => prev.map((d, idx) => idx === i ? { ...d, [field]: value } : d));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    dims.forEach((d, i) => {
      fd.set(`dim_id_${i}`, d.id);
      fd.set(`dim_name_${i}`, d.name);
      fd.set(`dim_method_${i}`, d.method);
      fd.set(`dim_weight_${i}`, String(d.weight));
      fd.set(`dim_threshold_${i}`, String(d.threshold));
    });
    startTransition(async () => {
      await updateRubric(rubric.id, fd);
    });
  }

  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold mb-4">Edit rubric</h2>
      <form onSubmit={handleSubmit} className="space-y-5">

        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Name" name="name" defaultValue={rubric.name} required
            tooltip="Human-readable display name for this rubric."
          />
          <Field
            label="Version" name="version" defaultValue={rubric.version} required mono
            tooltip="Semantic version string, e.g. 1.1, 2.0. Increment on any dimension or weight change to keep history traceable."
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Owner" name="owner" defaultValue={rubric.owner} required
            tooltip="Team or person responsible for maintaining this rubric and reviewing its results."
          />
          <div>
            <label className="block text-xs text-text-muted mb-1">
              Project
              <InfoTip text="Project this rubric is associated with. A rubric can be reused across versions of the same project." />
            </label>
            <select
              name="project_id"
              defaultValue={rubric.project_id}
              className="w-full px-3 py-2 bg-bg-panel border border-border-subtle rounded-md text-sm focus:outline-none focus:border-brand"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
        <Field
          label="Safety gates (comma-separated)"
          name="safety_gates"
          defaultValue={rubric.safety_gates.join(", ")}
          placeholder="pii_leakage, false_confirmation"
          tooltip="Gate IDs that act as hard blockers. If any gate triggers, the run is blocked regardless of weighted score. Use snake_case identifiers."
        />

        {/* Dimensions */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Dimensions</span>
              <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${weightOk ? "bg-ok/10 text-ok" : "bg-bad/10 text-bad"}`}>
                Σ = {weightSum.toFixed(2)}
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
              <div className="col-span-3" title="Scoring method applied to this dimension. Hover the select for per-method details.">Method</div>
              <div className="col-span-1 text-right" title="Fraction of the total score (0–1). All weights must sum to exactly 1.00.">Weight</div>
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
                  required
                />
                <input
                  className="col-span-2 px-2 py-1.5 text-xs font-mono bg-bg-panel border border-border-subtle rounded focus:outline-none focus:border-brand"
                  placeholder="dim_id"
                  title="Snake_case identifier used in scoring APIs and data exports. Must be unique within this rubric."
                  value={d.id}
                  onChange={(e) => updateDim(i, "id", e.target.value)}
                  required
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
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  title="Fraction of total score (0–1). All weights must sum to 1.00."
                  className="col-span-1 px-2 py-1.5 text-xs font-mono text-right bg-bg-panel border border-border-subtle rounded focus:outline-none focus:border-brand"
                  value={d.weight}
                  onChange={(e) => updateDim(i, "weight", parseFloat(e.target.value) || 0)}
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  title="Minimum score (0–100) for this dimension to count as passing. Cases below this threshold are flagged."
                  className="col-span-2 px-2 py-1.5 text-xs font-mono text-right bg-bg-panel border border-border-subtle rounded focus:outline-none focus:border-brand"
                  value={d.threshold}
                  onChange={(e) => updateDim(i, "threshold", parseInt(e.target.value) || 0)}
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
            {pending ? "Saving…" : "Save changes"}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/rubrics/${rubric.id}`)}
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
  label: string; name: string; defaultValue?: string | number;
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
