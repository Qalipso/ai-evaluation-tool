"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui";
import { readPassed } from "@/lib/wikiQuizzes";
import { LEARNING_PATHS, resolveArticles, type WikiArticle } from "@/lib/wiki";

/**
 * Client wrapper for Learning Paths.
 * Reads `localStorage` to highlight passed articles.
 * Subscribes to the `wiki-passed-changed` event so other tabs / quiz submissions
 * refresh this view without a page reload.
 */
export function LearningPathsClient() {
  const [passed, setPassed] = useState<Set<string>>(new Set());

  useEffect(() => {
    setPassed(readPassed());
    function refresh() {
      setPassed(readPassed());
    }
    window.addEventListener("wiki-passed-changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("wiki-passed-changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {LEARNING_PATHS.map((path) => {
        const articles = resolveArticles(path.articles);
        const allDone = articles.every((a) => passed.has(a.slug));
        return (
          <Card
            key={path.role}
            className={`p-4 space-y-3 ${allDone ? "border-ok/40" : ""}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{path.role}</p>
                <p className="text-[11px] text-text-muted mt-0.5">{path.focus}</p>
              </div>
              {allDone && (
                <span className="text-[9px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded border border-ok/40 text-ok shrink-0">
                  ✓ Complete
                </span>
              )}
            </div>

            <div className="space-y-1">
              {articles.map((a) => (
                <ArticleRow key={a.slug} article={a} passed={passed.has(a.slug)} />
              ))}
            </div>

            <div className="pt-1 border-t border-border-subtle flex flex-wrap gap-2 justify-between items-center">
              <div className="flex flex-wrap gap-1">
                {path.routes.map((r) => (
                  <Link
                    key={r.href}
                    href={r.href}
                    className="text-[10px] px-1.5 py-0.5 rounded border border-border-subtle text-text-muted hover:border-brand/40 hover:text-brand transition-colors"
                  >
                    {r.label}
                  </Link>
                ))}
              </div>
              <span className="text-[10px] text-text-muted">{path.readTime} min total</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function ArticleRow({ article, passed }: { article: WikiArticle; passed: boolean }) {
  return (
    <Link
      href={`/wiki/${article.slug}`}
      className={`flex items-center justify-between gap-2 group rounded px-1 -mx-1 ${
        passed ? "bg-ok/5" : ""
      }`}
    >
      <span className="flex items-center gap-2 min-w-0">
        <span
          className={`text-[10px] font-semibold shrink-0 ${
            passed ? "text-ok" : "text-text-muted"
          }`}
          aria-hidden
        >
          {passed ? "✓" : "·"}
        </span>
        <span
          className={`text-xs truncate transition-colors ${
            passed ? "text-ok" : "text-text-secondary group-hover:text-brand"
          }`}
        >
          {article.title}
        </span>
      </span>
      <span className="text-[10px] text-text-muted shrink-0">{article.readTime} min</span>
    </Link>
  );
}
