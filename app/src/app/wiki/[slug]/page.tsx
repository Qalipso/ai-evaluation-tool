import { notFound } from "next/navigation";
import Link from "next/link";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChevronLeft } from "lucide-react";
import {
  WIKI_ARTICLES,
  getArticle,
  getAdjacentArticles,
  resolveArticles,
} from "@/lib/wiki";
import { resolveSources, type WikiSource } from "@/lib/wikiSources";
import { ArticleQuiz } from "@/components/ArticleQuiz";

export function generateStaticParams() {
  // Exclude start-here — it has its own directory page
  return WIKI_ARTICLES.filter((a) => a.slug !== "start-here").map((a) => ({
    slug: a.slug,
  }));
}

export default async function WikiArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meta = getArticle(slug);
  if (!meta || meta.slug === "start-here") notFound();

  const wikiPath = join(process.cwd(), "..", "wiki", `${slug}.md`);
  if (!existsSync(wikiPath)) notFound();

  const content = readFileSync(wikiPath, "utf-8");
  const { prev, next } = getAdjacentArticles(slug);
  const related = resolveArticles(meta.relatedArticles);
  const sources = resolveSources(meta.sourceIds ?? []);

  return (
    <div className="max-w-3xl space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-text-muted">
        <Link href="/wiki" className="hover:text-brand transition-colors inline-flex items-center gap-1">
          <ChevronLeft size={12} /> Wiki
        </Link>
        <span>/</span>
        <span className="text-text-secondary">{meta.title}</span>
      </div>

      {/* Article meta strip */}
      <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-border-subtle">
        <span className="text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded border border-brand/40 text-brand capitalize">
          {meta.category.replace("-", " ")}
        </span>
        <span className="text-[10px] text-text-muted">{meta.readTime} min read</span>
        <span className="text-border-subtle">·</span>
        {meta.bestFor.map((role) => (
          <span key={role} className="text-[10px] text-text-muted">
            {role}
          </span>
        ))}
        {meta.relatedRoutes.length > 0 && (
          <>
            <span className="text-border-subtle">·</span>
            <span className="text-[10px] text-text-muted">See in app:</span>
            {meta.relatedRoutes.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="text-[10px] text-brand hover:text-brand-hover transition-colors"
              >
                {r.label}
              </Link>
            ))}
          </>
        )}
        {sources.length > 0 && (
          <>
            <span className="text-border-subtle">·</span>
            <span
              className="text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded border border-ok/40 text-ok"
              title={`${sources.length} primary source${sources.length === 1 ? "" : "s"}`}
            >
              Source-backed · {sources.length}
            </span>
          </>
        )}
      </div>

      {/* Markdown content */}
      <article className="prose-wiki">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </article>

      {/* Mini-quiz */}
      <ArticleQuiz slug={slug} />

      {/* Related + nav footer */}
      <div className="space-y-4 pt-4 border-t border-border-subtle">

        {/* See in app */}
        {meta.relatedRoutes.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-wide text-text-muted font-semibold mb-2">
              See this in the app
            </p>
            <div className="flex flex-wrap gap-2">
              {meta.relatedRoutes.map((r) => (
                <Link
                  key={r.href}
                  href={r.href}
                  className="px-3 py-1.5 text-xs border border-border-subtle rounded-md hover:border-brand/40 hover:text-brand text-text-secondary transition-colors"
                >
                  {r.label} →
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Sources used */}
        {sources.length > 0 && <SourcesBlock sources={sources} />}

        {/* Related articles */}
        {related.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-wide text-text-muted font-semibold mb-2">
              Related articles
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {related.map((a) => (
                <Link
                  key={a.slug}
                  href={`/wiki/${a.slug}`}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-md border border-border-subtle hover:border-brand/40 hover:bg-bg-hover transition-colors group"
                >
                  <span className="text-xs text-text-secondary group-hover:text-brand transition-colors truncate">
                    {a.title}
                  </span>
                  <span className="text-[10px] text-text-muted shrink-0">{a.readTime} min</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Prev / Next */}
        <div className="flex justify-between gap-4 pt-1">
          {prev ? (
            <Link href={`/wiki/${prev.slug}`} className="group flex-1">
              <div className="text-[10px] uppercase tracking-wide text-text-muted mb-1">Previous</div>
              <div className="text-xs font-medium group-hover:text-brand transition-colors">
                ← {prev.title}
              </div>
            </Link>
          ) : (
            <div />
          )}
          {next && (
            <Link href={`/wiki/${next.slug}`} className="group flex-1 text-right">
              <div className="text-[10px] uppercase tracking-wide text-text-muted mb-1">Next</div>
              <div className="text-xs font-medium group-hover:text-brand transition-colors">
                {next.title} →
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function SourcesBlock({ sources }: { sources: WikiSource[] }) {
  const TYPE_LABEL: Record<WikiSource["type"], string> = {
    paper: "Paper",
    "official-docs": "Official docs",
    standard: "Standard",
    framework: "Framework",
    benchmark: "Benchmark",
  };
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-text-muted font-semibold mb-2">
        Sources used
      </p>
      <ul className="space-y-1.5">
        {sources.map((s) => (
          <li
            key={s.id}
            className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 text-xs"
          >
            <span className="text-[10px] uppercase tracking-wide text-text-muted shrink-0 w-24">
              {TYPE_LABEL[s.type]}
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
      <p className="text-[10px] text-text-muted mt-2">
        Detail in <code className="font-mono">wiki/sources/source-cards.md</code>.
      </p>
    </div>
  );
}
