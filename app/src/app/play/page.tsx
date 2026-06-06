"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui";
import {
  CLAIM_LABELS,
  LABEL_COPY,
  PLAY_CASES,
  VERDICTS,
  VERDICT_COPY,
  sampleShift,
  type ClaimLabel,
  type PlayCase,
  type Shift,
  type Verdict,
} from "@/lib/playCases";

type PlayerCase = {
  claimLabels: Record<string, ClaimLabel | null>;
  verdict: Verdict | null;
  submitted: boolean;
};

type Stage = "briefing" | "playing" | "result";

const SHIFT_SIZE = 8;
// Fixed seed for SSR + first client render so hydration matches (avoids React #418).
// Client re-rolls a random shift on mount.
const SSR_SEED = 1;

function newShift(seed?: number): Shift {
  return sampleShift({ size: SHIFT_SIZE, minSafety: 1, minClean: 1, seed });
}

function initState(shift: Shift): PlayerCase[] {
  return shift.cases.map((c) => ({
    claimLabels: Object.fromEntries(c.claims.map((cl) => [cl.id, null])),
    verdict: null,
    submitted: false,
  }));
}

const TONE_TEXT: Record<string, string> = {
  ok: "text-ok",
  warn: "text-warn",
  bad: "text-bad",
  info: "text-brand",
};

const TONE_RING: Record<string, string> = {
  ok: "border-ok/50 bg-ok/10 text-ok",
  warn: "border-warn/50 bg-warn/10 text-warn",
  bad: "border-bad/50 bg-bad/10 text-bad",
  info: "border-brand/50 bg-brand/10 text-brand",
};

const TONE_RING_ACTIVE: Record<string, string> = {
  ok: "border-ok bg-ok/20 text-ok ring-2 ring-ok/40",
  warn: "border-warn bg-warn/20 text-warn ring-2 ring-warn/40",
  bad: "border-bad bg-bad/20 text-bad ring-2 ring-bad/40",
  info: "border-brand bg-brand/20 text-brand ring-2 ring-brand/40",
};

export default function PlayPage() {
  const [stage, setStage] = useState<Stage>("briefing");
  const [idx, setIdx] = useState(0);
  const [shift, setShift] = useState<Shift>(() => newShift(SSR_SEED));
  const [state, setState] = useState<PlayerCase[]>(() => initState(shift));

  // Re-roll a random shift after mount (client only) — SSR uses fixed seed.
  useEffect(() => {
    const fresh = newShift();
    setShift(fresh);
    setState(initState(fresh));
  }, []);

  const current = shift.cases[idx];
  const playerCase = state[idx];

  const allLabeled = playerCase
    ? Object.values(playerCase.claimLabels).every((v) => v !== null)
    : false;
  const canSubmit = allLabeled && playerCase?.verdict !== null;

  function setClaim(claimId: string, label: ClaimLabel) {
    setState((s) =>
      s.map((c, i) =>
        i === idx ? { ...c, claimLabels: { ...c.claimLabels, [claimId]: label } } : c,
      ),
    );
  }
  function setVerdict(v: Verdict) {
    setState((s) => s.map((c, i) => (i === idx ? { ...c, verdict: v } : c)));
  }
  function submit() {
    setState((s) => s.map((c, i) => (i === idx ? { ...c, submitted: true } : c)));
  }
  function next() {
    if (idx < shift.cases.length - 1) setIdx(idx + 1);
    else setStage("result");
  }
  function restart() {
    const fresh = newShift();
    setShift(fresh);
    setState(initState(fresh));
    setIdx(0);
    setStage("briefing");
  }

  if (stage === "briefing")
    return <Briefing shift={shift} onStart={() => setStage("playing")} onReshuffle={restart} />;
  if (stage === "result")
    return <ResultScreen shift={shift} state={state} onRestart={restart} />;

  return (
    <div className="max-w-4xl space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 text-xs text-text-muted">
        <div className="flex items-center gap-2">
          <Link href="/wiki" className="hover:text-brand transition-colors">Wiki</Link>
          <span>/</span>
          <Link href="/wiki" className="hover:text-brand transition-colors">Play</Link>
          <span>/</span>
          <span className="text-text-secondary font-mono">Case {idx + 1} of {shift.cases.length}</span>
          <span className="text-[10px] text-text-muted font-mono">· seed {shift.seed}</span>
        </div>
        <ProgressBar current={idx} total={shift.cases.length} state={state} />
      </div>

      <CaseCard
        c={current}
        pc={playerCase}
        onClaim={setClaim}
        onVerdict={setVerdict}
      />

      {/* Result panel (shown after submit) */}
      {playerCase.submitted && (
        <FeedbackPanel c={current} pc={playerCase} onNext={next} idx={idx} total={shift.cases.length} />
      )}

      {/* Submit button */}
      {!playerCase.submitted && (
        <div className="flex justify-between items-center">
          <p className="text-[11px] text-text-muted">
            Label every claim, then stamp a verdict.
          </p>
          <button
            disabled={!canSubmit}
            onClick={submit}
            className="px-4 py-2 text-xs font-semibold rounded-md bg-brand hover:bg-brand-hover text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Submit case
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Briefing ─────────────────────────────────────────────────────────────

function Briefing({
  shift,
  onStart,
  onReshuffle,
}: {
  shift: Shift;
  onStart: () => void;
  onReshuffle: () => void;
}) {
  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <Link href="/wiki" className="hover:text-brand transition-colors">Wiki</Link>
        <span>/</span>
        <span className="text-text-secondary">Play</span>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-wide font-semibold text-brand mb-1">
          Outputs, Please — Shift queue
        </p>
        <h1 className="text-2xl font-semibold">AI Inspection Booth №7</h1>
        <p className="text-sm text-text-secondary mt-2">
          {shift.cases.length} AI outputs cross your desk this shift, sampled from a pool of{" "}
          {shift.poolSize}. Label each claim, then stamp a verdict.
          Catch the hallucinations, the citation drift, the safety leaks. Wrong calls cost reputation.
        </p>
        <p className="text-[10px] text-text-muted font-mono mt-2">
          Seed: {shift.seed} · same seed = same shift order (replay determinism).
        </p>
      </div>

      <Card className="p-4 space-y-3">
        <Section label="Per case, you do three things">
          <ol className="list-decimal pl-5 text-xs text-text-secondary space-y-1.5">
            <li>Read the user input, retrieved chunks, and AI output.</li>
            <li>Label every atomic claim — Supported / Partial / Unsupported / Contradicted.</li>
            <li>Stamp a verdict — ✅ Ship, 🔍 Send to review, ❌ Block.</li>
          </ol>
        </Section>

        <Section label="What you are looking for">
          <ul className="text-xs text-text-secondary space-y-1.5">
            <li>Ghost numbers — invented precision the source never had.</li>
            <li>Citation drift — output cites doc-2 but the support is in doc-1.</li>
            <li>Stitched facts — two true claims merged into an unsupported third.</li>
            <li>Reverse direction — chunk says X→Y, output says Y→X.</li>
            <li>PII or prompt injection — instant block, regardless of dimension scores.</li>
          </ul>
        </Section>

        <Section label="How you score">
          <ul className="text-xs text-text-secondary space-y-1.5">
            <li>Claim accuracy — your labels vs ground truth.</li>
            <li>Verdict accuracy — your stamp vs ground truth.</li>
            <li>Safety gate — missing a safety case = automatic shift failure.</li>
          </ul>
        </Section>
      </Card>

      <div className="flex justify-between items-center">
        <button
          onClick={onReshuffle}
          className="px-3 py-1.5 text-xs text-text-secondary hover:text-brand border border-border-subtle hover:border-brand/40 rounded-md transition-colors"
        >
          ↻ Reshuffle pool
        </button>
        <button
          onClick={onStart}
          className="px-5 py-2 text-sm font-semibold rounded-md bg-brand hover:bg-brand-hover text-white transition-colors"
        >
          Start shift →
        </button>
      </div>
    </div>
  );
}

// ─── Case card ─────────────────────────────────────────────────────────────

function CaseCard({
  c,
  pc,
  onClaim,
  onVerdict,
}: {
  c: PlayCase;
  pc: PlayerCase;
  onClaim: (claimId: string, label: ClaimLabel) => void;
  onVerdict: (v: Verdict) => void;
}) {
  return (
    <Card className="p-5 space-y-5">
      {/* Case header */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-border-subtle">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-text-muted font-semibold font-mono">Case {c.id}</p>
          <p className="text-[11px] text-text-muted">Active rubric: shadow-rag-v1.0 · groundedness ≥ 80 · hallucination_risk ≥ 80 · safety = GATE</p>
        </div>
      </div>

      {/* Input */}
      <Section label="Input">
        <p className="text-sm font-mono bg-bg-hover/60 p-3 rounded border border-border-subtle">
          {c.input}
        </p>
      </Section>

      {/* Retrieved context */}
      <Section label="Retrieved context">
        <div className="space-y-1.5">
          {c.retrieved.map((r) => (
            <div key={r.id} className="text-xs bg-bg-hover/40 p-3 rounded border border-border-subtle">
              <span className="text-[10px] font-mono text-brand mr-2">[{r.id}]</span>
              <span className="text-text-secondary">{r.text}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* AI output */}
      <Section label="AI output">
        <p className="text-sm bg-bg-hover/60 p-3 rounded border border-border-subtle leading-relaxed">
          {c.output}
        </p>
      </Section>

      {/* Claim labelling */}
      <Section label="Label each claim">
        <div className="space-y-2.5">
          {c.claims.map((cl) => {
            const chosen = pc.claimLabels[cl.id];
            return (
              <div key={cl.id} className="space-y-1.5">
                <p className="text-xs text-text-secondary">
                  <span className="text-[10px] font-mono text-text-muted mr-2">{cl.id}</span>
                  {cl.text}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {CLAIM_LABELS.map((lbl) => {
                    const meta = LABEL_COPY[lbl];
                    const active = chosen === lbl;
                    return (
                      <button
                        key={lbl}
                        disabled={pc.submitted}
                        onClick={() => onClaim(cl.id, lbl)}
                        className={`text-[10px] uppercase tracking-wide font-semibold px-2 py-1 rounded border transition-colors disabled:opacity-60 disabled:cursor-default ${
                          active ? TONE_RING_ACTIVE[meta.tone] : TONE_RING[meta.tone] + " opacity-50 hover:opacity-100"
                        }`}
                      >
                        {meta.short}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Verdict */}
      <Section label="Verdict">
        <div className="flex flex-wrap gap-2">
          {VERDICTS.map((v) => {
            const meta = VERDICT_COPY[v];
            const active = pc.verdict === v;
            return (
              <button
                key={v}
                disabled={pc.submitted}
                onClick={() => onVerdict(v)}
                className={`text-xs font-semibold px-3 py-2 rounded border transition-colors disabled:opacity-60 disabled:cursor-default ${
                  active ? TONE_RING_ACTIVE[meta.tone] : TONE_RING[meta.tone] + " opacity-50 hover:opacity-100"
                }`}
              >
                <span className="mr-1.5">{meta.emoji}</span>
                {meta.short}
              </button>
            );
          })}
        </div>
      </Section>
    </Card>
  );
}

// ─── Feedback panel ────────────────────────────────────────────────────────

function FeedbackPanel({
  c,
  pc,
  onNext,
  idx,
  total,
}: {
  c: PlayCase;
  pc: PlayerCase;
  onNext: () => void;
  idx: number;
  total: number;
}) {
  const claimCorrect = c.claims.filter((cl) => pc.claimLabels[cl.id] === cl.truth).length;
  const verdictCorrect = pc.verdict === c.verdict;

  return (
    <Card className="p-5 space-y-4 border-brand/30">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wide font-semibold text-brand mb-1">Feedback · {c.conceptTitle}</p>
          <p className="text-sm text-text-secondary">{c.conceptDetail}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] uppercase tracking-wide text-text-muted">Claims</p>
          <p className="text-sm font-semibold font-mono">{claimCorrect} / {c.claims.length}</p>
          <p className={`text-[11px] mt-1 font-semibold ${verdictCorrect ? "text-ok" : "text-bad"}`}>
            {verdictCorrect ? "✓ Verdict correct" : "✗ Verdict wrong"}
          </p>
        </div>
      </div>

      {/* Per-claim breakdown */}
      <Section label="Claim ground truth">
        <div className="space-y-2">
          {c.claims.map((cl) => {
            const yours = pc.claimLabels[cl.id];
            const right = yours === cl.truth;
            return (
              <div key={cl.id} className="text-xs space-y-0.5">
                <p className="text-text-secondary">
                  <span className="text-[10px] font-mono text-text-muted mr-2">{cl.id}</span>
                  {cl.text}
                </p>
                <p className="text-[11px] text-text-muted pl-8">
                  Truth: <span className={`font-semibold ${TONE_TEXT[LABEL_COPY[cl.truth].tone]}`}>{LABEL_COPY[cl.truth].short}</span>
                  {" · "}
                  Your call: <span className={`font-semibold ${right ? "text-ok" : "text-bad"}`}>
                    {yours ? LABEL_COPY[yours].short : "—"}
                  </span>
                  {" · "}
                  <span className="text-text-muted italic">{cl.why}</span>
                </p>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Verdict ground truth */}
      <Section label="Verdict ground truth">
        <p className="text-xs text-text-secondary">
          <span className={`font-semibold ${TONE_TEXT[VERDICT_COPY[c.verdict].tone]} mr-2`}>
            {VERDICT_COPY[c.verdict].emoji} {VERDICT_COPY[c.verdict].short}
          </span>
          — {c.verdictReason}
        </p>
      </Section>

      {/* Safety findings */}
      {c.safety && c.safety.length > 0 && (
        <Section label="Safety findings (OWASP)">
          <ul className="space-y-1">
            {c.safety.map((s) => (
              <li key={s.category} className="text-xs">
                <span className="text-bad font-semibold">{s.owasp} {s.category}</span>
                <span className="text-text-muted"> · severity: {s.severity} · evidence: </span>
                <code className="font-mono text-[11px] bg-bad/10 px-1 rounded">{s.evidence}</code>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <div className="flex justify-between items-center pt-3 border-t border-border-subtle">
        <Link href={`/wiki/${c.wikiSlug}`} className="text-xs text-brand hover:text-brand-hover transition-colors">
          Read about this in the Wiki →
        </Link>
        <button
          onClick={onNext}
          className="px-4 py-2 text-xs font-semibold rounded-md bg-brand hover:bg-brand-hover text-white transition-colors"
        >
          {idx < total - 1 ? "Next case →" : "See shift report →"}
        </button>
      </div>
    </Card>
  );
}

// ─── Result screen ─────────────────────────────────────────────────────────

function ResultScreen({
  shift,
  state,
  onRestart,
}: {
  shift: Shift;
  state: PlayerCase[];
  onRestart: () => void;
}) {
  const cases = shift.cases;
  const stats = useMemo(() => {
    let claimsTotal = 0;
    let claimsRight = 0;
    let verdictsRight = 0;
    let safetyMissed = 0;
    state.forEach((pc, i) => {
      const c = cases[i];
      claimsTotal += c.claims.length;
      c.claims.forEach((cl) => {
        if (pc.claimLabels[cl.id] === cl.truth) claimsRight++;
      });
      if (pc.verdict === c.verdict) verdictsRight++;
      // Safety: case has safety findings AND player did not block → miss
      if (c.safety && c.safety.length > 0 && pc.verdict !== "block") safetyMissed++;
    });
    return { claimsTotal, claimsRight, verdictsRight, safetyMissed };
  }, [state, cases]);

  const claimPct = Math.round((stats.claimsRight / stats.claimsTotal) * 100);
  const verdictPct = Math.round((stats.verdictsRight / cases.length) * 100);
  const safetyFailed = stats.safetyMissed > 0;
  const won = !safetyFailed && verdictPct >= 80 && claimPct >= 75;
  const lost = safetyFailed || (verdictPct < 60 && claimPct < 50);

  const overall = safetyFailed
    ? "Shift failed: safety case mishandled."
    : won
    ? "Ship-ready calibration. You read like a trained reviewer."
    : verdictPct >= 60
    ? "Acceptable with caveats. Re-read the wiki articles linked below."
    : "Below threshold. Recommend re-reading the linked wiki pages before next shift.";

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <Link href="/wiki" className="hover:text-brand transition-colors">Wiki</Link>
        <span>/</span>
        <Link href="/play" className="hover:text-brand transition-colors">Play</Link>
        <span>/</span>
        <span className="text-text-secondary">Shift report</span>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-wide font-semibold text-brand mb-1">Shift complete · seed {shift.seed}</p>
        <h1 className="text-2xl font-semibold">Shift report</h1>
        <p className={`text-sm mt-2 ${safetyFailed ? "text-bad" : won ? "text-ok" : "text-warn"}`}>
          {overall}
        </p>
      </div>

      {/* Reward / meme */}
      {won && <WinCard claimPct={claimPct} verdictPct={verdictPct} />}
      {!won && lost && <LoseMeme safetyFailed={safetyFailed} />}
      {!won && !lost && <MidCard verdictPct={verdictPct} claimPct={claimPct} />}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-[10px] uppercase tracking-wide text-text-muted font-semibold">Claim accuracy</p>
          <p className="text-2xl font-semibold font-mono mt-1">{claimPct}%</p>
          <p className="text-[11px] text-text-muted mt-1">{stats.claimsRight} / {stats.claimsTotal} claims correctly labeled</p>
        </Card>
        <Card className="p-4">
          <p className="text-[10px] uppercase tracking-wide text-text-muted font-semibold">Verdict accuracy</p>
          <p className="text-2xl font-semibold font-mono mt-1">{verdictPct}%</p>
          <p className="text-[11px] text-text-muted mt-1">{stats.verdictsRight} / {cases.length} verdicts correct</p>
        </Card>
        <Card className={`p-4 ${safetyFailed ? "border-bad/50" : ""}`}>
          <p className="text-[10px] uppercase tracking-wide text-text-muted font-semibold">Safety gate</p>
          <p className={`text-2xl font-semibold font-mono mt-1 ${safetyFailed ? "text-bad" : "text-ok"}`}>
            {safetyFailed ? "FAIL" : "PASS"}
          </p>
          <p className="text-[11px] text-text-muted mt-1">
            {stats.safetyMissed} safety case{stats.safetyMissed === 1 ? "" : "s"} mishandled
          </p>
        </Card>
      </div>

      <Card className="p-5 space-y-3">
        <p className="text-[10px] uppercase tracking-wide text-text-muted font-semibold">Per-case breakdown</p>
        <div className="space-y-2">
          {state.map((pc, i) => {
            const c = cases[i];
            const claimsRight = c.claims.filter((cl) => pc.claimLabels[cl.id] === cl.truth).length;
            const verdictRight = pc.verdict === c.verdict;
            const safetyMiss = c.safety && c.safety.length > 0 && pc.verdict !== "block";
            return (
              <div key={c.id} className="flex items-start justify-between gap-3 text-xs pb-2 border-b border-border-subtle/60 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-text-secondary">
                    <span className="font-mono text-[10px] text-text-muted mr-2">{c.id}</span>
                    {c.teaches}
                  </p>
                  <Link href={`/wiki/${c.wikiSlug}`} className="text-[10px] text-brand/70 hover:text-brand transition-colors">
                    Wiki: {c.wikiSlug} →
                  </Link>
                </div>
                <div className="text-right shrink-0 text-[10px] font-mono">
                  <p className="text-text-secondary">{claimsRight} / {c.claims.length} claims</p>
                  <p className={verdictRight ? "text-ok" : "text-bad"}>
                    {verdictRight ? "✓" : "✗"} {VERDICT_COPY[c.verdict].short}
                    {!verdictRight && pc.verdict && <span className="text-text-muted"> (you: {VERDICT_COPY[pc.verdict].short})</span>}
                  </p>
                  {safetyMiss && <p className="text-bad font-semibold">SAFETY MISSED</p>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex justify-between items-center pt-3">
        <Link href="/wiki" className="text-xs text-text-muted hover:text-brand transition-colors">
          ← Back to Wiki
        </Link>
        <button
          onClick={onRestart}
          className="px-4 py-2 text-xs font-semibold rounded-md bg-brand hover:bg-brand-hover text-white transition-colors"
        >
          Restart shift
        </button>
      </div>
    </div>
  );
}

// ─── Reward / meme cards ───────────────────────────────────────────────────

function WinCard({ claimPct, verdictPct }: { claimPct: number; verdictPct: number }) {
  // Tier title based on combined score.
  const combined = (claimPct + verdictPct) / 2;
  const tier =
    combined >= 95 ? { title: "Senior Reviewer", emoji: "🏆", line: "Calibration delta within 2σ of an expert panel." }
    : combined >= 85 ? { title: "Trained Reviewer", emoji: "🎖️", line: "You read claims atomically. FActScore-grade." }
    : { title: "Cleared for Shift 2", emoji: "✅", line: "Above threshold. Promote next sampling iteration." };

  return (
    <Card className="p-5 border-ok/40 bg-gradient-to-br from-ok/5 to-bg-card relative overflow-hidden">
      {/* Confetti */}
      <div className="absolute inset-0 pointer-events-none select-none opacity-40 text-2xl"
           aria-hidden>
        <span className="absolute top-2 left-4 animate-bounce">🎉</span>
        <span className="absolute top-1 right-8 animate-pulse">✨</span>
        <span className="absolute bottom-2 left-12 animate-pulse">🎊</span>
        <span className="absolute bottom-3 right-4 animate-bounce">⭐</span>
        <span className="absolute top-1/2 left-1/3 animate-pulse">💚</span>
      </div>
      <div className="relative space-y-2">
        <p className="text-[10px] uppercase tracking-wide font-semibold text-ok">Shift passed</p>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <span className="text-2xl">{tier.emoji}</span>
          {tier.title}
        </h2>
        <p className="text-sm text-text-secondary">{tier.line}</p>
        <div className="pt-3 border-t border-ok/20 flex gap-4 text-[11px] text-text-muted font-mono">
          <span>Claim · <span className="text-ok font-semibold">{claimPct}%</span></span>
          <span>Verdict · <span className="text-ok font-semibold">{verdictPct}%</span></span>
          <span className="text-text-muted">Badge unlocked: source-backed reviewer.</span>
        </div>
      </div>
    </Card>
  );
}

const MEMES = [
  {
    title: "This is fine",
    art: [
      "    ┌──────────────┐",
      "    │  🔥  🔥  🔥  │",
      "    │   🐕         │  \"this is fine.\"",
      "    │  🔥  🔥  🔥  │",
      "    └──────────────┘",
    ],
    caption: "Safety case shipped. PII in the wild. The dashboard is on fire. The dog is in the room.",
  },
  {
    title: "Drake says no",
    art: [
      "  ┌────────────┐  ❌  Reading the chunk before stamping ship",
      "  │   🙅 Drake │",
      "  ├────────────┤  ✅  Vibes-based labeling",
      "  │   🙆 Drake │",
      "  └────────────┘",
    ],
    caption: "Judge fluency bias hit you. Try reading every claim against every chunk next shift.",
  },
  {
    title: "Two buttons",
    art: [
      "    ┌─────────────────────────┐",
      "    │  [ Block ]   [ Ship ]   │",
      "    │                         │",
      "    │       🥵 sweating       │",
      "    └─────────────────────────┘",
    ],
    caption: "Verdict accuracy fell below threshold. The button on the left was correct.",
  },
];

function LoseMeme({ safetyFailed }: { safetyFailed: boolean }) {
  // Pick a stable meme per shift (use safety flag + ms timestamp on mount).
  const meme = useMemo(() => {
    const idx = safetyFailed ? 0 : Math.floor(Math.random() * MEMES.length);
    return MEMES[idx];
  }, [safetyFailed]);

  return (
    <Card className="p-5 border-bad/40 bg-gradient-to-br from-bad/5 to-bg-card">
      <div className="space-y-3">
        <p className="text-[10px] uppercase tracking-wide font-semibold text-bad">
          {safetyFailed ? "Safety gate triggered" : "Shift failed"}
        </p>
        <h2 className="text-lg font-semibold">{meme.title}</h2>
        <pre className="text-[11px] font-mono text-text-secondary leading-tight overflow-x-auto bg-bg-hover/50 p-3 rounded border border-border-subtle">
{meme.art.join("\n")}
        </pre>
        <p className="text-xs text-text-muted italic">{meme.caption}</p>
        {safetyFailed && (
          <p className="text-[11px] text-bad pt-2 border-t border-bad/20">
            Safety findings are gate-blocking. No dimension score averages this away.
            (OWASP LLM01 / LLM06 / LLM08, NIST AI RMF Measure function.)
          </p>
        )}
      </div>
    </Card>
  );
}

function MidCard({ claimPct, verdictPct }: { claimPct: number; verdictPct: number }) {
  return (
    <Card className="p-5 border-warn/30 bg-gradient-to-br from-warn/5 to-bg-card">
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-wide font-semibold text-warn">Acceptable with caveats</p>
        <h2 className="text-base font-semibold">Calibration drift detected</h2>
        <p className="text-sm text-text-secondary">
          Score above the floor, below the bar. Same pattern an LLM judge with stale calibration
          shows. Re-read the wiki articles linked below before the next shift.
        </p>
        <div className="pt-2 flex gap-4 text-[11px] text-text-muted font-mono">
          <span>Claim · {claimPct}%</span>
          <span>Verdict · {verdictPct}%</span>
        </div>
      </div>
    </Card>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-wide text-text-muted font-semibold">{label}</p>
      {children}
    </div>
  );
}

function ProgressBar({ current, total, state }: { current: number; total: number; state: PlayerCase[] }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 w-4 rounded-full ${
            i === current
              ? "bg-brand"
              : state[i]?.submitted
              ? "bg-ok/60"
              : "bg-border-subtle"
          }`}
        />
      ))}
    </div>
  );
}
