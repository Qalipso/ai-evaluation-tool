"use client";

import { useState } from "react";
import { Scale, Network, Binary, Play, Save } from "lucide-react";
import type { AIModel } from "@/lib/data";
import type { EvalSettings } from "@/lib/db";
import { saveEvalSettings } from "./actions";

const LABEL_TONE: Record<string, string> = {
  supported: "text-ok",
  partially_supported: "text-warn",
  unsupported: "text-bad",
  contradicted: "text-bad",
};

export function EvaluatorsClient({ models, initial }: { models: AIModel[]; initial: EvalSettings }) {
  const [s, setS] = useState<EvalSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setSaved(false);
    setSaveErr(null);
    const res = await saveEvalSettings(s);
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else setSaveErr(res.error);
  }

  return (
    <div className="space-y-5">
      {/* Config */}
      <section className="elev-card p-6 space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Scale size={15} className="text-brand" /> Global configuration
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="LLM judge model">
            <select value={s.judge_model} onChange={(e) => setS({ ...s, judge_model: e.target.value })} className="input">
              {models.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Claim pipeline model">
            <select value={s.claim_model} onChange={(e) => setS({ ...s, claim_model: e.target.value })} className="input">
              {models.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label={`Claim confidence threshold · ${s.claim_threshold.toFixed(2)}`}>
          <input
            type="range" min={0} max={1} step={0.05}
            value={s.claim_threshold}
            onChange={(e) => setS({ ...s, claim_threshold: parseFloat(e.target.value) })}
            className="w-full accent-brand"
          />
        </Field>
        <div className="flex flex-wrap gap-4">
          <Toggle label="PII detection" checked={s.det_pii} onChange={(v) => setS({ ...s, det_pii: v })} />
          <Toggle label="False-confirmation detection" checked={s.det_false_confirm} onChange={(v) => setS({ ...s, det_false_confirm: v })} />
        </div>
        <div className="flex items-center gap-3 pt-1">
          <button onClick={save} disabled={saving} className="btn-pill btn-primary inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium disabled:opacity-40">
            <Save size={14} /> {saving ? "Saving…" : "Save configuration"}
          </button>
          {saved && <span className="text-xs text-ok">Saved.</span>}
          {saveErr && <span className="text-xs text-bad">{saveErr}</span>}
        </div>
      </section>

      <JudgeTester />
      <ClaimTester model={s.claim_model} />
      <DeterministicTester pii={s.det_pii} falseConfirm={s.det_false_confirm} />
    </div>
  );
}

// ── LLM judge tester (Helpfulness, single dim) ───────────────────────────────
function JudgeTester() {
  const [text, setText] = useState("");
  const [res, setRes] = useState<{ score: number; rationale: string; model: string; cost_usd: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    setLoading(true); setErr(null); setRes(null);
    try {
      const r = await fetch("/api/rubric/score", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const d = await r.json();
      if (!r.ok) setErr(d.error ?? `HTTP ${r.status}`); else setRes(d);
    } catch { setErr("Network error"); } finally { setLoading(false); }
  }

  return (
    <TesterShell icon={<Scale size={15} className="text-brand" />} title="LLM judge"
      desc="GPT-as-evaluator. Scores an output 1–5 on Helpfulness with cited rationale.">
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} className="input" placeholder="Paste an AI output to score…" />
      <RunRow onClick={run} loading={loading} disabled={!text.trim()} />
      {err && <ErrBox>{err}</ErrBox>}
      {res && (
        <div className="rounded-xl border border-border-subtle bg-bg-card p-4 text-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-lg font-semibold">{res.score}/5</span>
            <span className="text-[11px] text-text-muted font-mono">{res.model} · ${res.cost_usd.toFixed(5)}</span>
          </div>
          <p className="text-text-secondary">{res.rationale}</p>
        </div>
      )}
    </TesterShell>
  );
}

// ── Claim pipeline tester ────────────────────────────────────────────────────
function ClaimTester({ model }: { model: string }) {
  const [out, setOut] = useState("");
  const [ctx, setCtx] = useState("");
  const [res, setRes] = useState<{ claims: { text: string; label: string; confidence: number; source_idx: number | null; evidence: string }[]; score: number; cost_usd: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    setLoading(true); setErr(null); setRes(null);
    try {
      const r = await fetch("/api/eval/claims", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ ai_output: out, context: ctx.split("\n").map((s) => s.trim()).filter(Boolean), model }),
      });
      const d = await r.json();
      if (!r.ok) setErr(d.error ?? `HTTP ${r.status}`); else setRes(d);
    } catch { setErr("Network error"); } finally { setLoading(false); }
  }

  return (
    <TesterShell icon={<Network size={15} className="text-brand" />} title="Claim pipeline"
      desc="Extracts atomic claims and verifies each against the context → groundedness score.">
      <textarea value={out} onChange={(e) => setOut(e.target.value)} rows={4} className="input" placeholder="AI output to fact-check…" />
      <textarea value={ctx} onChange={(e) => setCtx(e.target.value)} rows={3} className="input" placeholder="Context — one source chunk per line (optional)…" />
      <RunRow onClick={run} loading={loading} disabled={!out.trim()} />
      {err && <ErrBox>{err}</ErrBox>}
      {res && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">Groundedness</span>
            <span className="font-mono">{res.score.toFixed(2)} · {res.claims.length} claims · ${res.cost_usd.toFixed(5)}</span>
          </div>
          {res.claims.map((c, i) => (
            <div key={i} className="rounded-xl border border-border-subtle bg-bg-card p-3 text-xs">
              <div className="flex items-center gap-2 mb-1">
                <span className={`uppercase font-mono text-[10px] ${LABEL_TONE[c.label] ?? ""}`}>{c.label.replaceAll("_", " ")}</span>
                <span className="text-text-muted">conf {c.confidence.toFixed(2)}{c.source_idx !== null ? ` · src [${c.source_idx}]` : ""}</span>
              </div>
              <div className="text-text-primary">{c.text}</div>
              {c.evidence && <div className="text-text-muted mt-0.5">{c.evidence}</div>}
            </div>
          ))}
        </div>
      )}
    </TesterShell>
  );
}

// ── Deterministic tester ─────────────────────────────────────────────────────
function DeterministicTester({ pii, falseConfirm }: { pii: boolean; falseConfirm: boolean }) {
  const [out, setOut] = useState("");
  const [exp, setExp] = useState("");
  const [res, setRes] = useState<{ findings: { category: string; severity: string; evidence: string }[]; safety: { score: number; rationale: string }; length: { score: number; rationale: string } } | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    setLoading(true); setErr(null); setRes(null);
    try {
      const r = await fetch("/api/eval/deterministic", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ ai_output: out, expected_behavior: exp, pii, false_confirm: falseConfirm }),
      });
      const d = await r.json();
      if (!r.ok) setErr(d.error ?? `HTTP ${r.status}`); else setRes(d);
    } catch { setErr("Network error"); } finally { setLoading(false); }
  }

  return (
    <TesterShell icon={<Binary size={15} className="text-brand" />} title="Deterministic checks"
      desc="Code-based, no LLM: PII, false-confirmation, length-vs-expectation.">
      <textarea value={out} onChange={(e) => setOut(e.target.value)} rows={3} className="input" placeholder="AI output to check…" />
      <textarea value={exp} onChange={(e) => setExp(e.target.value)} rows={2} className="input" placeholder="Expected behavior (for length heuristic, optional)…" />
      <RunRow onClick={run} loading={loading} disabled={!out.trim()} label="Run checks" />
      {err && <ErrBox>{err}</ErrBox>}
      {res && (
        <div className="space-y-2 text-sm">
          <div className="flex gap-4">
            <span>Safety: <span className="font-mono">{res.safety.score.toFixed(2)}</span></span>
            <span>Length: <span className="font-mono">{res.length.score.toFixed(2)}</span></span>
          </div>
          {res.findings.length === 0 ? (
            <div className="text-ok text-xs">No findings.</div>
          ) : (
            res.findings.map((f, i) => (
              <div key={i} className="rounded-xl border border-bad/30 bg-bad/5 p-3 text-xs">
                <span className="font-medium">{f.category}</span> · <span className="text-bad">{f.severity}</span>
                <div className="text-text-secondary mt-0.5">{f.evidence}</div>
              </div>
            ))
          )}
        </div>
      )}
    </TesterShell>
  );
}

// ── Shared bits ──────────────────────────────────────────────────────────────
function TesterShell({ icon, title, desc, children }: { icon: React.ReactNode; title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="elev-card p-6 space-y-3">
      <div>
        <h2 className="text-sm font-semibold flex items-center gap-2">{icon} {title}</h2>
        <p className="text-xs text-text-muted mt-0.5">{desc}</p>
      </div>
      {children}
    </section>
  );
}

function RunRow({ onClick, loading, disabled, label = "Run test" }: { onClick: () => void; loading: boolean; disabled: boolean; label?: string }) {
  return (
    <div className="flex items-center gap-3">
      <button onClick={onClick} disabled={loading || disabled} className="btn-pill btn-ghost inline-flex items-center gap-1.5 px-4 py-2 text-sm disabled:opacity-40">
        <Play size={13} /> {loading ? "Running…" : label}
      </button>
      <span className="text-[11px] text-text-muted">Real call · counts against daily budget</span>
    </div>
  );
}

function ErrBox({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl bg-bad/10 border border-bad/25 px-4 py-3 text-sm text-bad">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[13px] font-medium text-text-secondary tracking-wide">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-brand h-4 w-4" />
      {label}
    </label>
  );
}
