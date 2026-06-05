"use client";

import { useState } from "react";
import { Settings2, Save } from "lucide-react";
import type { AIModel } from "@/lib/data";
import type { EvalSettings } from "@/lib/db";
import { saveEvalSettings } from "@/app/evaluators/actions";

export function EvaluatorConfig({ models, initial }: { models: AIModel[]; initial: EvalSettings }) {
  const [s, setS] = useState<EvalSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setSaved(false);
    setErr(null);
    const res = await saveEvalSettings(s);
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else setErr(res.error);
  }

  const opts = models.length ? models : [{ id: "gpt-4o-mini", provider: "openai", label: "GPT-4o mini" }];

  return (
    <section className="elev-card p-6 space-y-4">
      <div>
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Settings2 size={15} className="text-brand" /> Global configuration
        </h2>
        <p className="text-xs text-text-muted mt-0.5">
          Defaults used by full evaluation runs. Per-run model can still be overridden on <span className="font-mono">/runs/new</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="LLM judge model">
          <select value={s.judge_model} onChange={(e) => setS({ ...s, judge_model: e.target.value })} className="input">
            {opts.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </Field>
        <Field label="Claim pipeline model">
          <select value={s.claim_model} onChange={(e) => setS({ ...s, claim_model: e.target.value })} className="input">
            {opts.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
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
        {err && <span className="text-xs text-bad">{err}</span>}
      </div>
    </section>
  );
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
