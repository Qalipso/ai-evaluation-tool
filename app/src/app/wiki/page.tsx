import Link from "next/link";
import { Card, Pill } from "@/components/ui";
import {
  WIKI_ARTICLES,
  WIKI_CATEGORIES,
  LEARNING_PATHS,
  getArticlesByCategory,
  resolveArticles,
  type WikiArticle,
} from "@/lib/wiki";
import { WIKI_SOURCES } from "@/lib/wikiSources";
import { LearningPathsClient } from "@/components/LearningPathsClient";

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "getting-started": "Start here before reading anything else.",
  "core-concepts": "The foundational ideas behind every evaluation.",
  "workflows": "Step-by-step operational procedures.",
  "advanced": "Deep dives for engineers optimizing evaluation pipelines.",
};

export default function WikiIndexPage() {
  return (
    <div className="max-w-5xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Wiki</h1>
        <p className="text-text-secondary text-sm mt-1">
          Practical evaluation knowledge base — the opinion layer of the tool.
        </p>
      </header>

      {/* Hero */}
      <HeroCard />

      {/* Play promo */}
      <PlayPromoCard />

      {/* Learning paths — client-rendered so passed articles light up green via localStorage */}
      <section className="space-y-3">
        <SectionHeader label="Learning Paths" desc="Quiz-passed articles light up green." />
        <LearningPathsClient />
      </section>

      {/* Categorized articles */}
      {WIKI_CATEGORIES.map((cat) => {
        const articles = getArticlesByCategory(cat.id);
        return (
          <section key={cat.id} className="space-y-3">
            <SectionHeader
              label={cat.label}
              desc={CATEGORY_DESCRIPTIONS[cat.id]}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {articles.map((a) => (
                <ArticleCard key={a.slug} article={a} />
              ))}
            </div>
          </section>
        );
      })}

      <p className="text-[11px] text-text-muted pb-4">
        {WIKI_ARTICLES.length} articles · {WIKI_SOURCES.length} primary sources ·
        Read time {WIKI_ARTICLES.reduce((s, a) => s + a.readTime, 0)} min total ·
        Source files in <code className="font-mono">projects/ai-evaluation-tool/wiki/</code> ·
        Source cards in <code className="font-mono">wiki/sources/source-cards.md</code>
      </p>
    </div>
  );
}

function HeroCard() {
  return (
    <Card className="p-5 border-brand/20 bg-gradient-to-br from-bg-card to-bg-hover">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wide font-semibold text-brand">New to AI evaluation?</p>
          <h2 className="text-base font-semibold">Start with the 10-minute guide</h2>
          <p className="text-xs text-text-secondary max-w-md">
            Understand projects, rubrics, cases, runs, safety gates, and reports before diving into
            individual articles.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Link
            href="/wiki/start-here"
            className="px-3 py-1.5 bg-brand hover:bg-brand-hover text-xs font-medium rounded-md transition-colors"
          >
            Start guide
          </Link>
          <Link
            href="/projects/shadow-daily-reflection"
            className="px-3 py-1.5 border border-border-subtle hover:bg-bg-hover text-xs text-text-secondary rounded-md transition-colors"
          >
            Run demo evaluation
          </Link>
          <Link
            href="/reports"
            className="px-3 py-1.5 border border-border-subtle hover:bg-bg-hover text-xs text-text-secondary rounded-md transition-colors"
          >
            Open example report
          </Link>
        </div>
      </div>
    </Card>
  );
}

function PlayPromoCard() {
  return (
    <Card className="p-5 border-ok/30 bg-gradient-to-br from-bg-card to-bg-hover">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wide font-semibold text-ok">Interactive · 10 cases · ~8 min</p>
          <h2 className="text-base font-semibold">Outputs, Please — practice mode</h2>
          <p className="text-xs text-text-secondary max-w-md">
            AI Inspection Booth №7. Label claims, catch ghost numbers, citation drift, PII leaks,
            prompt injection. Each case maps to one wiki article.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Link
            href="/play"
            className="px-3 py-1.5 bg-ok hover:bg-ok/80 text-bg text-xs font-medium rounded-md transition-colors"
          >
            Start shift →
          </Link>
        </div>
      </div>
    </Card>
  );
}

function ArticleCard({ article }: { article: WikiArticle }) {
  const sourceCount = article.sourceIds?.length ?? 0;
  return (
    <Link href={`/wiki/${article.slug}`} className="group block">
      <Card className="p-4 h-full hover:border-brand/40 transition-colors">
        <div className="flex flex-col h-full gap-2.5">
          <div className="flex-1 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold group-hover:text-brand transition-colors">
                {article.title}
              </p>
              {sourceCount > 0 && (
                <span
                  className="text-[9px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded border border-ok/40 text-ok shrink-0"
                  title={`${sourceCount} primary source${sourceCount === 1 ? "" : "s"}`}
                >
                  {sourceCount} src
                </span>
              )}
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">{article.summary}</p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border-subtle/60">
            <div className="flex flex-wrap gap-1">
              {article.bestFor.map((role) => (
                <span
                  key={role}
                  className="text-[10px] px-1.5 py-0.5 bg-bg-hover border border-border-subtle rounded text-text-muted"
                >
                  {role}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {article.relatedRoutes.slice(0, 1).map((r) => (
                <span key={r.href} className="text-[10px] text-brand/70">
                  {r.label}
                </span>
              ))}
              <span className="text-[10px] text-text-muted">{article.readTime} min</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function SectionHeader({ label, desc }: { label: string; desc?: string }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted whitespace-nowrap">
        {label}
      </h2>
      <div className="h-px flex-1 bg-border-subtle" />
      {desc && <p className="text-[11px] text-text-muted whitespace-nowrap hidden sm:block">{desc}</p>}
    </div>
  );
}
