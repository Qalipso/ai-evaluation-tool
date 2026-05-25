"use client";
import { useState } from "react";

const MAX_CHARS = 2000;

type ScoreResult = {
  score: number;
  rationale: string;
  model: string;
  cost_usd: number;
};

const DOTS = ["●○○○○", "●●○○○", "●●●○○", "●●●●○", "●●●●●"] as const;

function ScoreDots({ score }: { score: number }) {
  const dots = DOTS[score - 1] ?? DOTS[0];
  const color =
    score >= 4 ? "text-ok" : score === 3 ? "text-warn" : "text-bad";
  return (
    <span className={`font-mono tracking-widest text-lg ${color}`}>{dots}</span>
  );
}

export function RubricScorer({ rubricId }: { rubricId: string }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const remaining = MAX_CHARS - text.length;
  const canSubmit = text.trim().length > 0 && !loading && remaining >= 0;

  async function handleScore() {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/rubric/score", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, rubric_id: rubricId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`);
      } else {
        setResult(data as ScoreResult);
      }
    } catch {
      setError("Network error — check console");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-brand/30 bg-bg-panel p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Live LLM Scorer</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Helpfulness · GPT-4o-mini · real API call
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-wider bg-brand/10 text-brand px-2 py-0.5 rounded-full">
          Live
        </span>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste an AI response here to score its helpfulness (max 2000 chars)…"
        rows={5}
        maxLength={MAX_CHARS}
        className="w-full rounded-md border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-muted resize-y focus:outline-none focus:ring-1 focus:ring-brand"
      />

      <div className="flex items-center justify-between">
        <span className={`text-xs font-mono ${remaining < 100 ? "text-warn" : "text-text-muted"}`}>
          {remaining} chars left
        </span>
        <button
          onClick={handleScore}
          disabled={!canSubmit}
          className="px-4 py-1.5 rounded-md text-sm font-medium bg-brand hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Scoring…" : "Score with real LLM"}
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-bad/10 border border-bad/30 px-4 py-3 text-sm text-bad">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-md border border-border-subtle bg-bg-base p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Score</div>
              <div className="flex items-center gap-3">
                <ScoreDots score={result.score} />
                <span className="font-mono text-xl font-semibold">{result.score}/5</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-text-muted">Model</div>
              <div className="text-xs font-mono text-text-secondary">{result.model}</div>
              <div className="text-xs text-text-muted mt-1">Cost</div>
              <div className="text-xs font-mono text-text-secondary">
                ${result.cost_usd.toFixed(5)}
              </div>
            </div>
          </div>
          <div>
            <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Rationale</div>
            <p className="text-sm text-text-secondary leading-relaxed">{result.rationale}</p>
          </div>
        </div>
      )}
    </div>
  );
}
