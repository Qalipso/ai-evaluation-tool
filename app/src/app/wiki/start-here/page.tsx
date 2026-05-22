import Link from "next/link";
import { Card } from "@/components/ui";
import { getAdjacentArticles, getArticle } from "@/lib/wiki";
import { resolveSources } from "@/lib/wikiSources";
import { ArticleQuiz } from "@/components/ArticleQuiz";

const CORE_WORKFLOW = [
  {
    step: "Project",
    desc: "Define what AI behavior you are evaluating, which model, and which rubric to use.",
    route: "/projects",
  },
  {
    step: "Rubric",
    desc: "Set scoring dimensions, weights, thresholds, and safety gates for this project.",
    route: "/rubrics",
  },
  {
    step: "Cases",
    desc: "Each case is one input → output pair with extracted claims, scores, and safety findings.",
    route: "/runs",
  },
  {
    step: "Run",
    desc: "Execute evaluation on a dataset. Produces scores, verdicts, and regression flags.",
    route: "/runs",
  },
  {
    step: "Review",
    desc: "Human reviewers inspect flagged cases, verify safety findings, and override if needed.",
    route: "/review",
  },
  {
    step: "Report",
    desc: "Reproducible 13-section report with verdict, dimension breakdown, and recommendations.",
    route: "/reports",
  },
];

const KEY_TERMS = [
  {
    term: "Project",
    def: "A named evaluation context: one AI behavior, one default model, one active rubric.",
  },
  {
    term: "Rubric",
    def: "A versioned scoring template with dimensions, weights (sum = 1), and thresholds.",
  },
  {
    term: "Case",
    def: "One input/output pair evaluated against a rubric. Holds claims, scores, and safety findings.",
  },
  {
    term: "Run",
    def: "A complete evaluation of a dataset through a rubric. Produces an overall score and verdict.",
  },
  {
    term: "Dimension",
    def: "A single scoring axis inside a rubric — e.g., accuracy, groundedness, tone fit.",
  },
  {
    term: "Safety gate",
    def: "A rubric dimension that, if it fails, blocks the run from receiving a passing verdict — regardless of overall score.",
  },
  {
    term: "Hallucination risk",
    def: "Claims in AI output labeled as unsupported or contradicted by retrieved context or known facts.",
  },
  {
    term: "Groundedness",
    def: "The degree to which AI output faithfully reflects retrieved source chunks — not general truth.",
  },
  {
    term: "Human override",
    def: "A reviewer-submitted score replacement on a specific dimension, with a required reason.",
  },
];

const READ_RESULT_STEPS = [
  {
    n: "1",
    label: "Safety status",
    desc: "Check first. Any open safety finding blocks ship. Red = do not ship.",
  },
  {
    n: "2",
    label: "Failed dimensions",
    desc: "Which scoring dimensions fell below threshold? These drive the verdict.",
  },
  {
    n: "3",
    label: "Hallucination claims",
    desc: "Count unsupported and contradicted claims. Review evidence text for each.",
  },
  {
    n: "4",
    label: "Groundedness evidence",
    desc: "Check which retrieved chunks were used, ignored, or misrepresented.",
  },
  {
    n: "5",
    label: "Review queue",
    desc: "Cases with open findings or low confidence are queued for human review.",
  },
  {
    n: "6",
    label: "Overall score",
    desc: "Weighted aggregate. Ship-ready ≥ 85, Acceptable 70–84, Needs work 55–69, Blocked < 55 or safety gate failed.",
  },
];

const DEMO_PATH = [
  { n: "1", action: "Open Projects", detail: "Select Shadow — Daily Reflection", href: "/projects/shadow-daily-reflection" },
  { n: "2", action: "Open latest Eval Run", detail: "Check verdict and overall score", href: "/runs" },
  { n: "3", action: "Inspect dimension breakdown", detail: "Which dimensions are below threshold?", href: "/runs" },
  { n: "4", action: "Open a failed case", detail: "Read AI output, scores, and rationale", href: "/runs" },
  { n: "5", action: "Check claim labels", detail: "Identify unsupported and contradicted claims", href: "/runs" },
  { n: "6", action: "Open Human Review", detail: "See which cases are queued and why", href: "/review" },
  { n: "7", action: "Open Reports", detail: "View or generate the full evaluation report", href: "/reports" },
];

const COMPARISON = [
  { aspect: "Dataset", bad: "Different inputs each run", good: "Same held-out dataset every run" },
  { aspect: "Rubric", bad: "Changed between runs", good: "Pinned version — only one variable changed" },
  { aspect: "Verdict", bad: "Based on vibe / single metric", good: "Weighted multi-dimension with safety gate" },
  { aspect: "Claims", bad: "No source attribution", good: "Every claim traced to evidence or flagged" },
  { aspect: "Regression", bad: "Not tracked", good: "Compared against prior run on same rubric" },
  { aspect: "Review", bad: "Ad hoc, no record", good: "Structured queue, override stored with reason" },
];

const CHECKLIST = [
  "Project has a named owner and an active rubric with normalized weights",
  "Rubric has at least one safety gate dimension",
  "Held-out evaluation dataset is fixed — not the training or fine-tuning set",
  "Judge model is a different family from the model under evaluation",
  "All open safety findings are resolved or accepted with a documented reason",
  "Regression check passed: run compared against last stable baseline",
  "At least one human reviewer has spot-checked safety-flagged cases",
  "Report generated and stored for the run",
];

export default function StartHerePage() {
  const { prev, next } = getAdjacentArticles("start-here");
  const meta = getArticle("start-here");
  const sources = resolveSources(meta?.sourceIds ?? []);

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-text-muted">
        <Link href="/wiki" className="hover:text-brand transition-colors">Wiki</Link>
        <span>/</span>
        <span>Start Here</span>
      </div>

      {/* Title */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded border border-brand/40 text-brand">Getting Started</span>
          <span className="text-[10px] text-text-muted">10 min read</span>
        </div>
        <h1 className="text-2xl font-semibold">Start Here: AI Evaluation in 10 Minutes</h1>
        <p className="text-text-secondary text-sm">
          Core workflow, key terms, how to read an eval result, and a first demo path through the tool.
        </p>
      </div>

      {/* What this tool does */}
      <section className="space-y-3">
        <SectionHeader n="01" title="What this tool does" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card className="p-4">
            <p className="text-[10px] uppercase tracking-wide text-ok font-semibold mb-2">Does</p>
            <ul className="space-y-1.5 text-xs text-text-secondary">
              <li className="flex gap-2"><span className="text-ok shrink-0">+</span>Evaluate AI outputs against rubric dimensions</li>
              <li className="flex gap-2"><span className="text-ok shrink-0">+</span>Extract and label claims for hallucination risk</li>
              <li className="flex gap-2"><span className="text-ok shrink-0">+</span>Measure groundedness against retrieved context</li>
              <li className="flex gap-2"><span className="text-ok shrink-0">+</span>Track regressions across model or prompt changes</li>
              <li className="flex gap-2"><span className="text-ok shrink-0">+</span>Flag safety findings and route to human review</li>
              <li className="flex gap-2"><span className="text-ok shrink-0">+</span>Generate reproducible evaluation reports</li>
            </ul>
          </Card>
          <Card className="p-4">
            <p className="text-[10px] uppercase tracking-wide text-bad font-semibold mb-2">Does not</p>
            <ul className="space-y-1.5 text-xs text-text-secondary">
              <li className="flex gap-2"><span className="text-bad shrink-0">−</span>Train or fine-tune AI models</li>
              <li className="flex gap-2"><span className="text-bad shrink-0">−</span>Generate AI outputs (evaluation only, not inference)</li>
              <li className="flex gap-2"><span className="text-bad shrink-0">−</span>Guarantee factual accuracy outside retrieved context</li>
              <li className="flex gap-2"><span className="text-bad shrink-0">−</span>Replace domain expert review for high-stakes decisions</li>
              <li className="flex gap-2"><span className="text-bad shrink-0">−</span>Produce a single universal quality score across projects</li>
              <li className="flex gap-2"><span className="text-bad shrink-0">−</span>Version or deploy prompts to production</li>
            </ul>
          </Card>
        </div>
      </section>

      {/* Core workflow */}
      <section className="space-y-3">
        <SectionHeader n="02" title="Core workflow" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {CORE_WORKFLOW.map((item, i) => (
            <Link key={item.step} href={item.route} className="group">
              <Card className="p-3 h-full hover:border-brand/50 transition-colors">
                <div className="flex items-start gap-1.5 mb-1.5">
                  <span className="text-[10px] text-text-muted font-mono shrink-0">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <p className="text-xs font-semibold mb-1 group-hover:text-brand transition-colors">{item.step}</p>
                <p className="text-[11px] text-text-muted leading-snug">{item.desc}</p>
              </Card>
            </Link>
          ))}
        </div>
        <p className="text-[11px] text-text-muted">Each step links to its corresponding view in the app.</p>
      </section>

      {/* Key terms */}
      <section className="space-y-3">
        <SectionHeader n="03" title="Key terms" />
        <Card className="p-0 overflow-hidden">
          {KEY_TERMS.map((t, i) => (
            <div key={t.term} className={`flex gap-4 px-4 py-2.5 ${i < KEY_TERMS.length - 1 ? "border-b border-border-subtle" : ""}`}>
              <span className="text-xs font-semibold font-mono text-brand w-32 shrink-0 pt-0.5">{t.term}</span>
              <span className="text-xs text-text-secondary leading-relaxed">{t.def}</span>
            </div>
          ))}
        </Card>
      </section>

      {/* How to read an eval result */}
      <section className="space-y-3">
        <SectionHeader n="04" title="How to read an evaluation result" />
        <div className="space-y-2">
          {READ_RESULT_STEPS.map((s) => (
            <Card key={s.n} className="p-3 flex gap-3 items-start">
              <span className="text-xs font-mono font-semibold text-brand bg-brand/10 w-6 h-6 flex items-center justify-center rounded shrink-0">{s.n}</span>
              <div>
                <p className="text-xs font-semibold mb-0.5">{s.label}</p>
                <p className="text-[11px] text-text-secondary leading-relaxed">{s.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* First demo path */}
      <section className="space-y-3">
        <SectionHeader n="05" title="First demo path" />
        <p className="text-xs text-text-secondary">Follow these steps to complete a full evaluation walkthrough in the app.</p>
        <div className="space-y-1.5">
          {DEMO_PATH.map((s) => (
            <Link key={s.n} href={s.href} className="group block">
              <div className="flex gap-3 items-center px-3 py-2.5 rounded-md border border-border-subtle hover:border-brand/40 hover:bg-bg-hover transition-colors">
                <span className="text-[10px] font-mono font-semibold text-brand bg-brand/10 w-5 h-5 flex items-center justify-center rounded shrink-0">{s.n}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium">{s.action}</span>
                  <span className="text-text-muted mx-1.5">·</span>
                  <span className="text-[11px] text-text-muted">{s.detail}</span>
                </div>
                <span className="text-[10px] text-text-muted group-hover:text-brand transition-colors">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Good vs bad evaluation */}
      <section className="space-y-3">
        <SectionHeader n="06" title="Good evaluation vs bad evaluation" />
        <Card className="overflow-hidden p-0">
          <div className="grid grid-cols-3 text-[10px] uppercase tracking-wide font-semibold text-text-muted border-b border-border-subtle">
            <div className="px-4 py-2">Aspect</div>
            <div className="px-4 py-2 border-l border-border-subtle text-bad">Bad</div>
            <div className="px-4 py-2 border-l border-border-subtle text-ok">Good</div>
          </div>
          {COMPARISON.map((row, i) => (
            <div key={row.aspect} className={`grid grid-cols-3 text-xs ${i < COMPARISON.length - 1 ? "border-b border-border-subtle" : ""}`}>
              <div className="px-4 py-2.5 font-medium text-text-secondary">{row.aspect}</div>
              <div className="px-4 py-2.5 border-l border-border-subtle text-text-muted">{row.bad}</div>
              <div className="px-4 py-2.5 border-l border-border-subtle text-text-secondary">{row.good}</div>
            </div>
          ))}
        </Card>
      </section>

      {/* Before launch checklist */}
      <section className="space-y-3">
        <SectionHeader n="07" title="Before launch checklist" />
        <Card className="p-4">
          <ul className="space-y-2">
            {CHECKLIST.map((item, i) => (
              <li key={i} className="flex gap-2.5 items-start">
                <span className="w-4 h-4 border border-border-subtle rounded shrink-0 mt-0.5" />
                <span className="text-xs text-text-secondary leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* Sources used */}
      {sources.length > 0 && (
        <section className="space-y-3">
          <SectionHeader n="08" title="Sources behind this guide" />
          <Card className="p-4 space-y-2">
            <p className="text-[11px] text-text-muted leading-relaxed">
              The workflow above (Project → Rubric → Case → Run → Review → Report) is the standard
              evaluation loop used by these primary sources. Each one is paraphrased in
              <code className="font-mono mx-1">wiki/sources/source-cards.md</code>.
            </p>
            <ul className="space-y-1.5">
              {sources.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 text-xs"
                >
                  <span className="text-[10px] uppercase tracking-wide text-text-muted shrink-0 w-24">
                    {s.type === "official-docs" ? "Official docs" : s.type}
                  </span>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-brand hover:text-brand-hover transition-colors font-medium"
                  >
                    {s.title}
                  </a>
                  <span className="text-text-muted">— {s.appliedTo}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}

      {/* Mini-quiz */}
      <ArticleQuiz slug="start-here" />

      {/* Prev / Next nav */}
      <div className="border-t border-border-subtle pt-5">
        <div className="flex justify-between gap-4">
          {prev ? (
            <Link href={`/wiki/${prev.slug}`} className="group flex-1">
              <div className="text-[10px] uppercase tracking-wide text-text-muted mb-1">Previous</div>
              <div className="text-xs font-medium group-hover:text-brand transition-colors">← {prev.title}</div>
            </Link>
          ) : <div />}
          {next && (
            <Link href={`/wiki/${next.slug}`} className="group flex-1 text-right">
              <div className="text-[10px] uppercase tracking-wide text-text-muted mb-1">Next</div>
              <div className="text-xs font-medium group-hover:text-brand transition-colors">{next.title} →</div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[10px] font-mono text-text-muted">{n}</span>
      <div className="h-px flex-1 bg-border-subtle" />
      <h2 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{title}</h2>
      <div className="h-px flex-1 bg-border-subtle" />
    </div>
  );
}
