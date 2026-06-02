"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Project, Rubric } from "@/lib/data";
import { runEvaluation } from "../actions";

const MAX_OUTPUT = 8000;

export function NewRunForm({ projects, rubrics }: { projects: Project[]; rubrics: Rubric[] }) {
  const router = useRouter();
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [aiOutput, setAiOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rubricsForProject = useMemo(() => {
    const scoped = rubrics.filter((r) => r.project_id === projectId);
    return scoped.length ? scoped : rubrics;
  }, [rubrics, projectId]);

  const [rubricId, setRubricId] = useState(rubricsForProject[0]?.id ?? "");

  function onProjectChange(id: string) {
    setProjectId(id);
    const scoped = rubrics.filter((r) => r.project_id === id);
    setRubricId((scoped[0] ?? rubrics[0])?.id ?? "");
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      fd.set("project_id", projectId);
      fd.set("rubric_id", rubricId);
      const res = await runEvaluation(fd);
      if (res.ok) {
        router.push(`/cases/${res.case_id}`);
      } else {
        setError(res.error);
        setLoading(false);
      }
    } catch {
      setError("Network error — check console.");
      setLoading(false);
    }
  }

  const activeRubric = rubrics.find((r) => r.id === rubricId);
  const remaining = MAX_OUTPUT - aiOutput.length;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Project">
          <select
            value={projectId}
            onChange={(e) => onProjectChange(e.target.value)}
            className="input"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Rubric">
          <select value={rubricId} onChange={(e) => setRubricId(e.target.value)} className="input">
            {rubricsForProject.map((r) => (
              <option key={r.id} value={r.id}>{r.name} · v{r.version}</option>
            ))}
          </select>
        </Field>
      </div>

      {activeRubric && (
        <p className="text-xs text-text-muted">
          {activeRubric.dimensions.length} dimensions ·{" "}
          {activeRubric.dimensions.filter((d) => d.method === "llm_judge" || d.method === "semantic_similarity").length}{" "}
          scored by LLM judge · {activeRubric.safety_gates.length} safety gate(s)
        </p>
      )}

      <Field label="User input" hint="The prompt or question given to the AI.">
        <textarea name="input" rows={2} className="input" placeholder="How do I reset my API key?" />
      </Field>

      <Field label="Expected behavior" hint="What a good response should do.">
        <textarea name="expected_behavior" rows={2} className="input" placeholder="Give clear steps, cite the docs, no invented endpoints." />
      </Field>

      <Field label="AI output" hint="The response to evaluate (required).">
        <textarea
          name="ai_output"
          rows={6}
          required
          maxLength={MAX_OUTPUT}
          value={aiOutput}
          onChange={(e) => setAiOutput(e.target.value)}
          className="input"
          placeholder="Paste the AI-generated response here…"
        />
        <span className={`text-xs font-mono ${remaining < 200 ? "text-warn" : "text-text-muted"}`}>
          {remaining} chars left
        </span>
      </Field>

      <Field label="Retrieved context" hint="Optional. One source chunk per line (for groundedness).">
        <textarea name="retrieved_context" rows={3} className="input" placeholder={"Chunk 1…\nChunk 2…"} />
      </Field>

      {error && (
        <div className="rounded-md bg-bad/10 border border-bad/30 px-4 py-3 text-sm text-bad">{error}</div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading || !rubricId}
          className="px-4 py-2 rounded-md text-sm font-medium bg-brand hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Evaluating…" : "Run evaluation"}
        </button>
        <span className="text-xs text-text-muted">Real LLM-judge call. Subject to the daily budget cap.</span>
      </div>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-text-primary">{label}</span>
      {hint && <span className="block text-xs text-text-muted">{hint}</span>}
      {children}
    </label>
  );
}
