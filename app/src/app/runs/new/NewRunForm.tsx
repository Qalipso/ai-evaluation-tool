"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Sparkles, Wand2, Upload, X, Database } from "lucide-react";
import type { Project, Rubric, AIModel } from "@/lib/data";
import { saveDataset } from "@/app/datasets/actions";

const MAX_OUTPUT = 8000;
const GEN_COUNT = 6;
const FALLBACK_MODEL = "gpt-4o-mini";

type Row = {
  question: string;
  expected_behavior: string;
  ai_output: string;
  answering: boolean;
};

const emptyRow = (): Row => ({ question: "", expected_behavior: "", ai_output: "", answering: false });

export function NewRunForm({
  projects,
  rubrics,
  models,
}: {
  projects: Project[];
  rubrics: Rubric[];
  models: AIModel[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  // Only OpenAI models are runnable (single API key). Others would need keys.
  const openaiModels = useMemo(() => models.filter((m) => m.provider === "openai"), [models]);

  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const rubricsForProject = useMemo(() => {
    const scoped = rubrics.filter((r) => r.project_id === projectId);
    return scoped.length ? scoped : rubrics;
  }, [rubrics, projectId]);
  const [rubricId, setRubricId] = useState(rubricsForProject[0]?.id ?? "");

  function defaultModelFor(pid: string): string {
    const proj = projects.find((p) => p.id === pid);
    if (proj && openaiModels.some((m) => m.id === proj.model)) return proj.model;
    return openaiModels[0]?.id ?? FALLBACK_MODEL;
  }
  const [model, setModel] = useState(() => defaultModelFor(projects[0]?.id ?? ""));
  const projectDefaultModel = projects.find((p) => p.id === projectId)?.model ?? "";

  const [masterPrompt, setMasterPrompt] = useState("");
  const [contextText, setContextText] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);

  const [genQ, setGenQ] = useState(false);
  const [genAll, setGenAll] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [savingDs, setSavingDs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const activeRubric = rubrics.find((r) => r.id === rubricId);
  const contextChunks = contextText.split("\n").map((s) => s.trim()).filter(Boolean);
  const readyCases = rows.filter((r) => r.ai_output.trim().length > 0).length;

  function onProjectChange(id: string) {
    setProjectId(id);
    const scoped = rubrics.filter((r) => r.project_id === id);
    setRubricId((scoped[0] ?? rubrics[0])?.id ?? "");
    setModel(defaultModelFor(id));
  }

  async function onFiles(list: FileList | null) {
    if (!list) return;
    const added: string[] = [];
    const chunks: string[] = [];
    for (const f of Array.from(list)) {
      if (!/\.(txt|md)$/i.test(f.name)) continue;
      const text = await f.text();
      const parts = text.split(/\n\s*\n/).map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean);
      chunks.push(...parts);
      added.push(f.name);
    }
    if (chunks.length) {
      setContextText((prev) => [prev.trim(), ...chunks].filter(Boolean).join("\n"));
      setFiles((prev) => [...prev, ...added]);
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function generateQuestions() {
    setError(null);
    setNotice(null);
    setGenQ(true);
    try {
      const res = await fetch("/api/eval/questions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          rubric_id: rubricId,
          master_prompt: masterPrompt,
          context: contextChunks,
          count: GEN_COUNT,
          model,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setRows(
        (data.questions as { question: string; expected_behavior: string }[]).map((q) => ({
          question: q.question,
          expected_behavior: q.expected_behavior,
          ai_output: "",
          answering: false,
        })),
      );
      setNotice(`Generated ${data.questions.length} questions. Now generate answers, then run.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate questions");
    } finally {
      setGenQ(false);
    }
  }

  async function answerRow(i: number): Promise<string> {
    const row = rows[i];
    const res = await fetch("/api/eval/answer", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ master_prompt: masterPrompt, question: row.question, context: contextChunks, model }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
    return data.answer as string;
  }

  async function generateAnswer(i: number) {
    setError(null);
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, answering: true } : r)));
    try {
      const answer = await answerRow(i);
      setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ai_output: answer, answering: false } : r)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate answer");
      setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, answering: false } : r)));
    }
  }

  async function generateAllAnswers() {
    setError(null);
    setGenAll(true);
    try {
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].ai_output.trim()) continue;
        await generateAnswer(i);
      }
    } finally {
      setGenAll(false);
    }
  }

  function updateRow(i: number, field: keyof Row, value: string) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  }
  function removeRow(i: number) {
    setRows((rs) => rs.filter((_, idx) => idx !== i));
  }

  async function saveAsDataset() {
    setError(null);
    setNotice(null);
    const cases = rows
      .filter((r) => r.question.trim())
      .map((r) => ({ input: r.question, expected_behavior: r.expected_behavior }));
    if (cases.length === 0) {
      setError("Generate questions first.");
      return;
    }
    const name = window.prompt("Dataset name", `${activeRubric?.name ?? "Set"} · ${cases.length} cases`);
    if (!name) return;
    setSavingDs(true);
    const res = await saveDataset({ project_id: projectId, name, cases });
    setSavingDs(false);
    if (res.ok) setNotice(`Saved dataset "${name}".`);
    else setError(res.error);
  }

  async function runBatch() {
    setError(null);
    const cases = rows
      .filter((r) => r.ai_output.trim())
      .map((r) => ({
        input: r.question,
        expected_behavior: r.expected_behavior,
        ai_output: r.ai_output,
        retrieved_context: contextChunks,
      }));
    if (cases.length === 0) {
      setError("Generate or paste at least one answer before running.");
      return;
    }

    setSubmitting(true);
    setProgress({ done: 0, total: cases.length });
    try {
      // Per-case orchestration: short requests, live progress, prod-timeout-safe.
      const startRes = await fetch("/api/eval/run/start", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ project_id: projectId, rubric_id: rubricId, model }),
      });
      const startData = await startRes.json();
      if (!startRes.ok) throw new Error(startData.error ?? "start failed");
      const runId = startData.run_id as string;

      for (let i = 0; i < cases.length; i++) {
        const c = cases[i];
        const r = await fetch("/api/eval/run/case", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ run_id: runId, rubric_id: rubricId, model, index: i, ...c }),
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? `case ${i + 1} failed`);
        setProgress({ done: i + 1, total: cases.length });
      }

      await fetch("/api/eval/run/finalize", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ run_id: runId }),
      });
      router.push(`/runs/${runId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error — check console.");
      setSubmitting(false);
      setProgress(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Project + rubric */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Project">
          <select value={projectId} onChange={(e) => onProjectChange(e.target.value)} className="input">
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
        <p className="text-[11px] text-text-muted -mt-3 text-center tracking-wide">
          {activeRubric.dimensions.length} dimensions ·{" "}
          {activeRubric.dimensions.filter((d) => d.method === "llm_judge" || d.method === "semantic_similarity").length}{" "}
          scored by LLM judge · {activeRubric.safety_gates.length} safety gate(s)
        </p>
      )}

      <Field
        label="Evaluation model"
        hint="Generates questions + answers and runs the LLM judge. Defaults to the project model; pick another to compare."
      >
        <select value={model} onChange={(e) => setModel(e.target.value)} className="input">
          {openaiModels.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
              {m.id === projectDefaultModel ? " · project default" : ""}
            </option>
          ))}
          {openaiModels.length === 0 && <option value={FALLBACK_MODEL}>GPT-4o mini</option>}
        </select>
      </Field>

      {/* Master prompt */}
      <Field label="Master prompt" hint="System prompt that defines the assistant under test. Used to generate candidate answers.">
        <textarea
          value={masterPrompt}
          onChange={(e) => setMasterPrompt(e.target.value)}
          rows={4}
          className="input"
          placeholder="You are AreaMosa's booking assistant. Be concise, never confirm a booking you haven't actually made…"
        />
      </Field>

      {/* Context files */}
      <Field label="Retrieved context" hint="Optional. Upload .txt/.md files (split into chunks) or edit chunks below — one per line.">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="btn-pill btn-ghost inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs"
          >
            <Upload size={13} /> Upload .txt / .md
          </button>
          <input ref={fileRef} type="file" accept=".txt,.md" multiple hidden onChange={(e) => onFiles(e.target.files)} />
          {files.map((f, i) => (
            <span key={i} className="inline-flex items-center gap-1 text-[11px] bg-bg-card border border-border-subtle rounded-full px-2.5 py-0.5 text-text-secondary">
              {f}
              <button type="button" onClick={() => setFiles((p) => p.filter((_, idx) => idx !== i))} className="hover:text-bad">
                <X size={11} />
              </button>
            </span>
          ))}
          <span className="text-[11px] text-text-muted ml-auto">{contextChunks.length} chunks</span>
        </div>
        <textarea
          value={contextText}
          onChange={(e) => setContextText(e.target.value)}
          rows={3}
          className="input"
          placeholder={"One context chunk per line…"}
        />
      </Field>

      {/* Generate questions */}
      <div className="flex flex-wrap items-center gap-3 hairline pt-6 mt-1">
        <button
          type="button"
          onClick={generateQuestions}
          disabled={genQ || !rubricId}
          className="btn-pill btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium disabled:opacity-40"
        >
          <Sparkles size={14} /> {genQ ? "Generating…" : `Generate ${GEN_COUNT} questions`}
        </button>
        <button
          type="button"
          onClick={() => setRows((r) => [...r, emptyRow()])}
          className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-brand px-2 py-1 rounded-full transition-colors"
        >
          <Plus size={13} /> Add manually
        </button>
        {rows.length > 0 && (
          <>
            <button
              type="button"
              onClick={saveAsDataset}
              disabled={savingDs}
              className="btn-pill btn-ghost inline-flex items-center gap-1.5 text-xs px-3.5 py-2 disabled:opacity-40 ml-auto"
            >
              <Database size={13} /> {savingDs ? "Saving…" : "Save as dataset"}
            </button>
            <button
              type="button"
              onClick={generateAllAnswers}
              disabled={genAll}
              className="btn-pill btn-ghost inline-flex items-center gap-1.5 text-xs px-3.5 py-2 disabled:opacity-40"
            >
              <Wand2 size={13} /> {genAll ? "Answering…" : "Generate all answers"}
            </button>
          </>
        )}
      </div>

      {notice && <div className="rounded-xl bg-brand/10 border border-brand/25 px-4 py-2.5 text-xs text-brand text-center">{notice}</div>}
      {error && <div className="rounded-xl bg-bad/10 border border-bad/25 px-4 py-3 text-sm text-bad text-center">{error}</div>}

      {/* Question rows */}
      {rows.length > 0 && (
        <div className="space-y-3">
          {rows.map((row, i) => (
            <div key={i} className="rounded-2xl border border-border-subtle bg-bg-card p-5 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-[10px] font-mono text-text-muted mt-2.5 w-5 shrink-0">#{i + 1}</span>
                <div className="flex-1 space-y-2.5">
                  <textarea
                    value={row.question}
                    onChange={(e) => updateRow(i, "question", e.target.value)}
                    rows={2}
                    className="input"
                    placeholder="Test question…"
                  />
                  <textarea
                    value={row.expected_behavior}
                    onChange={(e) => updateRow(i, "expected_behavior", e.target.value)}
                    rows={2}
                    className="input text-text-secondary"
                    placeholder="Expected behavior…"
                  />
                  <div className="relative">
                    <textarea
                      value={row.ai_output}
                      onChange={(e) => updateRow(i, "ai_output", e.target.value)}
                      rows={4}
                      maxLength={MAX_OUTPUT}
                      className="input"
                      placeholder="AI answer (generate or paste)…"
                    />
                    <button
                      type="button"
                      onClick={() => generateAnswer(i)}
                      disabled={row.answering || !row.question.trim()}
                      className="btn-pill btn-ghost absolute top-2.5 right-2.5 inline-flex items-center gap-1 text-[11px] px-2.5 py-1 disabled:opacity-40"
                    >
                      <Wand2 size={11} /> {row.answering ? "…" : "Generate answer"}
                    </button>
                  </div>
                </div>
                <button type="button" onClick={() => removeRow(i)} className="text-text-muted hover:text-bad mt-1.5">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Run */}
      <div className="hairline pt-6 mt-1 flex flex-col items-center gap-2.5">
        <button
          type="button"
          onClick={runBatch}
          disabled={submitting || readyCases === 0}
          className="btn-pill btn-primary px-8 py-3 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {progress
            ? `Evaluating ${progress.done}/${progress.total}…`
            : submitting
              ? "Starting…"
              : `Run evaluation · ${readyCases} case${readyCases === 1 ? "" : "s"}`}
        </button>
        {progress && (
          <div className="w-full max-w-xs h-1.5 rounded-full bg-bg-hover overflow-hidden">
            <div
              className="h-full bg-brand transition-all duration-300"
              style={{ width: `${Math.round((progress.done / Math.max(progress.total, 1)) * 100)}%` }}
            />
          </div>
        )}
        <span className="text-[11px] text-text-muted">Each case scored separately · subject to the daily budget cap</span>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[13px] font-medium text-text-secondary tracking-wide">{label}</span>
      {hint && <span className="block text-xs text-text-muted leading-relaxed">{hint}</span>}
      {children}
    </label>
  );
}
