"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, ChevronRight, UserCheck } from "lucide-react";
import type { Case, Dimension } from "@/lib/data";
import { methodLabel, labelTone } from "@/lib/data";
import { Bar, scoreTone } from "@/components/ui";
import { saveHumanScore } from "@/app/review/actions";

function tone(v: number, threshold: number): string {
  const t = scoreTone(v, threshold);
  return t === "ok" ? "text-ok" : t === "warn" ? "text-warn" : "text-bad";
}

export function DimensionBreakdown({ dims, cases }: { dims: Dimension[]; cases: Case[] }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {dims.map((d) => {
        const perCase = cases.map((c) => ({ c, s: c.scores.find((s) => s.dim_id === d.id) ?? null }));
        const scored = perCase.filter((x) => x.s !== null);
        const avg = scored.length ? scored.reduce((a, x) => a + (x.s!.score), 0) / scored.length : null;
        const isHuman = d.method === "human";
        const v = avg ?? 0;
        const passed = avg !== null && avg >= d.threshold;
        const isOpen = open === d.id;

        return (
          <div key={d.id} className="rounded-xl border border-border-subtle overflow-hidden">
            <button
              onClick={() => setOpen(isOpen ? null : d.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-bg-hover transition-colors"
            >
              {isOpen ? <ChevronDown size={15} className="text-text-muted shrink-0" /> : <ChevronRight size={15} className="text-text-muted shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm">
                    {d.name}
                    <span className="text-text-muted text-[11px] ml-2">· {methodLabel[d.method] ?? d.method} · weight {d.weight.toFixed(2)}</span>
                  </span>
                  <span className="font-mono text-xs shrink-0">
                    {avg !== null ? (
                      <>
                        <span className={tone(v, d.threshold)}>{avg.toFixed(2)}</span>
                        <span className="text-text-muted"> ≥{d.threshold.toFixed(2)}</span>
                        {!passed && <span className="text-bad ml-2">below</span>}
                      </>
                    ) : isHuman ? (
                      <span className="text-brand inline-flex items-center gap-1"><UserCheck size={11} /> needs review</span>
                    ) : (
                      <span className="text-text-muted">n/a</span>
                    )}
                  </span>
                </div>
                <div className="mt-1.5"><Bar value={v} tone={scoreTone(v, d.threshold)} /></div>
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-border-subtle bg-bg-card/50 px-4 py-3 space-y-2">
                {isHuman ? (
                  <HumanDimDetail dim={d} perCase={perCase} />
                ) : (
                  <AutoDimDetail dim={d} perCase={perCase} />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AutoDimDetail({ dim, perCase }: { dim: Dimension; perCase: { c: Case; s: Case["scores"][number] | null }[] }) {
  return (
    <div className="space-y-2">
      {perCase.map(({ c, s }) => (
        <div key={c.id} className="rounded-lg border border-border-subtle bg-bg-card p-3 text-xs">
          <div className="flex items-center justify-between">
            <Link href={`/cases/${c.id}`} className="font-mono text-[11px] text-text-muted hover:text-brand">{c.id}</Link>
            {s ? (
              <span className={`font-mono ${tone(s.score, dim.threshold)}`}>{s.score.toFixed(2)} {s.threshold_passed ? "" : "· below"}</span>
            ) : (
              <span className="text-text-muted">unscored</span>
            )}
          </div>
          {s?.rationale && <p className="text-text-secondary mt-1 leading-relaxed">{s.rationale}</p>}
          {dim.method === "claim_pipeline" && c.claims.length > 0 && (
            <div className="mt-2 space-y-1">
              {c.claims.map((cl, i) => (
                <div key={i} className="flex items-start gap-2 border-t border-border-subtle pt-1.5">
                  <span className={`shrink-0 text-[10px] uppercase ${labelTone[cl.label] ?? ""}`}>{cl.label.replace("_", " ")}</span>
                  <span className="text-text-secondary">{cl.text} {cl.evidence && <span className="text-text-muted">— {cl.evidence}</span>}</span>
                </div>
              ))}
            </div>
          )}
          {dim.id === "safety" && c.safety_findings.length > 0 && (
            <div className="mt-2 space-y-1">
              {c.safety_findings.map((f, i) => (
                <div key={i} className="text-bad border-t border-border-subtle pt-1.5">{f.category} · {f.severity} — {f.evidence}</div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function HumanDimDetail({ dim, perCase }: { dim: Dimension; perCase: { c: Case; s: Case["scores"][number] | null }[] }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] text-text-muted">
        No automated scorer — enter a score (0–1) for each case with a short rationale.
      </p>
      {perCase.map(({ c, s }) => (
        <HumanCaseRow key={c.id} caseId={c.id} input={c.input} output={c.ai_output} dimId={dim.id} threshold={dim.threshold} existing={s} />
      ))}
    </div>
  );
}

function HumanCaseRow({
  caseId, input, output, dimId, threshold, existing,
}: {
  caseId: string; input: string; output: string; dimId: string; threshold: number;
  existing: Case["scores"][number] | null;
}) {
  const router = useRouter();
  const [score, setScore] = useState(existing?.score ?? 0.7);
  const [rationale, setRationale] = useState(existing?.rationale ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true); setError(null); setSaved(false);
    const res = await saveHumanScore({ caseId, dimId, score, rationale });
    setSaving(false);
    if (res.ok) { setSaved(true); router.refresh(); }
    else setError(res.error);
  }

  const pass = score >= threshold;

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-card p-3 text-xs space-y-2">
      <div className="flex items-center justify-between">
        <Link href={`/cases/${caseId}`} className="font-mono text-[11px] text-text-muted hover:text-brand">{caseId}</Link>
        <span className={`font-mono ${pass ? "text-ok" : "text-bad"}`}>{score.toFixed(2)} ≥{threshold.toFixed(2)}</span>
      </div>
      <div className="text-text-secondary line-clamp-1"><span className="text-text-muted">Q:</span> {input || "—"}</div>
      <div className="text-text-secondary line-clamp-2"><span className="text-text-muted">A:</span> {output || "—"}</div>
      <input type="range" min={0} max={1} step={0.05} value={score} onChange={(e) => setScore(parseFloat(e.target.value))} className="w-full accent-brand" />
      <textarea value={rationale} onChange={(e) => setRationale(e.target.value)} rows={2} className="input" placeholder="Rationale…" />
      <div className="flex items-center gap-2">
        <button onClick={save} disabled={saving} className="btn-pill btn-primary px-3.5 py-1.5 text-[11px] disabled:opacity-40">
          {saving ? "Saving…" : existing ? "Update score" : "Save score"}
        </button>
        {saved && <span className="text-ok text-[11px]">Saved.</span>}
        {error && <span className="text-bad text-[11px]">{error}</span>}
      </div>
    </div>
  );
}
