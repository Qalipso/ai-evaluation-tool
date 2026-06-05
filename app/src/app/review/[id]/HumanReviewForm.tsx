"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitHumanReview } from "../actions";

type Dim = { id: string; name: string; threshold: number };

export function HumanReviewForm({ caseId, dims }: { caseId: string; dims: Dim[] }) {
  const router = useRouter();
  const [reviewer, setReviewer] = useState("");
  const [vals, setVals] = useState<Record<string, { score: number; rationale: string }>>(
    Object.fromEntries(dims.map((d) => [d.id, { score: 0.7, rationale: "" }])),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(id: string, field: "score" | "rationale", value: number | string) {
    setVals((v) => ({ ...v, [id]: { ...v[id], [field]: value } }));
  }

  async function submit() {
    setError(null);
    setSaving(true);
    try {
      const res = await submitHumanReview({
        caseId,
        reviewer,
        scores: dims.map((d) => ({ dim_id: d.id, score: vals[d.id].score, rationale: vals[d.id].rationale })),
      });
      if (res.ok) router.push("/review");
      else {
        setError(res.error);
        setSaving(false);
      }
    } catch {
      setError("Network error — check console.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {dims.map((d) => {
        const v = vals[d.id];
        const pass = v.score >= d.threshold;
        return (
          <div key={d.id} className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium">{d.name}</span>
              <span className={`font-mono text-sm ${pass ? "text-ok" : "text-bad"}`}>
                {v.score.toFixed(2)} <span className="text-text-muted text-xs">≥{d.threshold.toFixed(2)}</span>
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={v.score}
              onChange={(e) => set(d.id, "score", parseFloat(e.target.value))}
              className="w-full accent-brand"
            />
            <textarea
              value={v.rationale}
              onChange={(e) => set(d.id, "rationale", e.target.value)}
              rows={2}
              className="input"
              placeholder="Rationale — why this score?"
            />
          </div>
        );
      })}

      <div className="hairline pt-4 space-y-3">
        <input
          value={reviewer}
          onChange={(e) => setReviewer(e.target.value)}
          className="input"
          placeholder="Your name (reviewer)"
        />
        {error && <div className="rounded-xl bg-bad/10 border border-bad/25 px-4 py-3 text-sm text-bad text-center">{error}</div>}
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="btn-pill btn-primary w-full py-3 text-sm font-semibold disabled:opacity-40"
        >
          {saving ? "Saving…" : "Submit review"}
        </button>
      </div>
    </div>
  );
}
