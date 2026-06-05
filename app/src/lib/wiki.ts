export interface WikiArticle {
  slug: string;
  title: string;
  category: "getting-started" | "core-concepts" | "workflows" | "advanced";
  summary: string;
  bestFor: string[];
  readTime: number; // minutes
  relatedRoutes: { label: string; href: string }[];
  relatedArticles: string[]; // slugs
  /**
   * IDs from `lib/wikiSources.ts → WIKI_SOURCES` that back claims in this article.
   * Used to show the "source-backed" badge on the index and the
   * "Sources used" block on the article page.
   */
  sourceIds: string[];
  order: number;
}

export interface LearningPath {
  role: string;
  focus: string;
  articles: string[]; // slugs, max 3
  readTime: number; // total minutes (sum of article readTimes)
  routes: { label: string; href: string }[];
}

export const WIKI_ARTICLES: WikiArticle[] = [
  {
    slug: "start-here",
    title: "Start Here: AI Evaluation in 10 Minutes",
    category: "getting-started",
    summary:
      "Core workflow, key terms, how to read an eval result, and a first demo path through the tool.",
    bestFor: ["Everyone"],
    readTime: 10,
    relatedRoutes: [
      { label: "Projects", href: "/projects" },
      { label: "Eval Runs", href: "/runs" },
    ],
    relatedArticles: ["evaluation-principles", "scoring-rubrics"],
    sourceIds: ["openai-evals", "langsmith", "anthropic-evals"],
    order: 1,
  },
  {
    slug: "evaluation-reports",
    title: "Evaluation Reports",
    category: "getting-started",
    summary:
      "How to read and generate a 13-section evaluation report — from verdict to appendix.",
    bestFor: ["Product Managers", "Reviewers"],
    readTime: 8,
    relatedRoutes: [{ label: "Reports", href: "/reports" }],
    relatedArticles: ["evaluation-principles", "human-review"],
    sourceIds: [
      "openai-evals",
      "langsmith",
      "nist-ai-rmf",
      "mt-bench-judge",
      "llm-judge-survey",
      "owasp-llm-top10",
    ],
    order: 2,
  },
  {
    slug: "evaluation-principles",
    title: "Evaluation Principles",
    category: "core-concepts",
    summary:
      "15 core principles and 7 anti-principles that govern how evaluations are designed and interpreted.",
    bestFor: ["Everyone", "AI Engineers"],
    readTime: 12,
    relatedRoutes: [
      { label: "Projects", href: "/projects" },
      { label: "Rubrics", href: "/rubrics" },
    ],
    relatedArticles: ["scoring-rubrics", "evaluation-reports"],
    sourceIds: [
      "helm",
      "openai-evals",
      "anthropic-evals",
      "nist-ai-rmf",
      "mt-bench-judge",
      "llm-judge-survey",
      "owasp-llm-top10",
    ],
    order: 3,
  },
  {
    slug: "scoring-rubrics",
    title: "Scoring Rubrics",
    category: "core-concepts",
    summary:
      "10 reference dimensions, 5 starter rubrics, weight normalization rules, and versioning strategy.",
    bestFor: ["AI Engineers", "Product Managers"],
    readTime: 14,
    relatedRoutes: [{ label: "Rubrics", href: "/rubrics" }],
    relatedArticles: ["evaluation-principles", "llm-as-judge", "hallucination-risk"],
    sourceIds: [
      "helm",
      "ifeval",
      "g-eval",
      "ragas",
      "openai-evals",
      "anthropic-evals",
    ],
    order: 4,
  },
  {
    slug: "hallucination-risk",
    title: "Hallucination Risk",
    category: "core-concepts",
    summary:
      "How claims are labeled as supported, partially supported, unsupported, or contradicted.",
    bestFor: ["AI Engineers", "Reviewers"],
    readTime: 7,
    relatedRoutes: [{ label: "Eval Runs", href: "/runs" }],
    relatedArticles: ["groundedness", "human-review"],
    sourceIds: ["factscore", "truthfulqa", "selfcheckgpt", "mt-bench-judge"],
    order: 5,
  },
  {
    slug: "groundedness",
    title: "Groundedness",
    category: "core-concepts",
    summary:
      "Faithfulness to retrieved context — how to score source utilization and detect citation drift.",
    bestFor: ["AI Engineers", "Reviewers"],
    readTime: 9,
    relatedRoutes: [{ label: "Eval Runs", href: "/runs" }],
    relatedArticles: ["hallucination-risk", "scoring-rubrics"],
    sourceIds: ["trulens-triad", "ragas", "factscore", "ares"],
    order: 6,
  },
  {
    slug: "regression-evaluation",
    title: "Regression Evaluation",
    category: "workflows",
    summary:
      "How to detect measurable drops between runs on the same dataset, rubric, and retrieved context.",
    bestFor: ["AI Engineers", "Product Managers"],
    readTime: 8,
    relatedRoutes: [{ label: "Regression", href: "/regression" }],
    relatedArticles: ["evaluation-principles", "evaluation-reports"],
    sourceIds: [
      "openai-evals",
      "langsmith",
      "helm",
      "mt-bench-judge",
      "llm-judge-survey",
      "ifeval",
    ],
    order: 7,
  },
  {
    slug: "human-review",
    title: "Human Review",
    category: "workflows",
    summary:
      "Queue ordering, override mechanics, two-reviewer policy, and calibration loop protocol.",
    bestFor: ["Reviewers", "Trust & Safety"],
    readTime: 10,
    relatedRoutes: [{ label: "Human Review", href: "/review" }],
    relatedArticles: ["hallucination-risk", "evaluation-reports"],
    sourceIds: [
      "mt-bench-judge",
      "llm-judge-survey",
      "nist-ai-rmf",
      "owasp-llm-top10",
      "mitre-atlas",
    ],
    order: 8,
  },
  {
    slug: "llm-as-judge",
    title: "LLM-as-Judge",
    category: "advanced",
    summary:
      "8 failure modes, judge selection rules, calibration loop, and when not to use LLM judges.",
    bestFor: ["AI Engineers"],
    readTime: 11,
    relatedRoutes: [
      { label: "Rubrics", href: "/rubrics" },
      { label: "Eval Runs", href: "/runs" },
    ],
    relatedArticles: ["scoring-rubrics", "human-review"],
    sourceIds: [
      "g-eval",
      "mt-bench-judge",
      "llm-judge-survey",
      "selfcheckgpt",
      "helm",
      "openai-evals",
    ],
    order: 9,
  },
  {
    slug: "evaluators",
    title: "Evaluators: Methods That Actually Run",
    category: "workflows",
    summary:
      "How the four scoring methods work in this tool — LLM judge, claim pipeline (groundedness), deterministic checks, and human review — and how to configure and test them.",
    bestFor: ["AI Engineers", "QA / AI Reviewers"],
    readTime: 8,
    relatedRoutes: [
      { label: "Evaluators", href: "/evaluators" },
      { label: "New run", href: "/runs/new" },
    ],
    relatedArticles: ["llm-as-judge", "groundedness", "human-review"],
    sourceIds: [],
    order: 10,
  },
];

export const WIKI_CATEGORIES: {
  id: WikiArticle["category"];
  label: string;
}[] = [
  { id: "getting-started", label: "Getting Started" },
  { id: "core-concepts", label: "Core Concepts" },
  { id: "workflows", label: "Workflows" },
  { id: "advanced", label: "Advanced" },
];

export const LEARNING_PATHS: LearningPath[] = [
  {
    role: "Product Managers",
    focus: "Launch readiness, reports, and regressions",
    articles: ["evaluation-reports", "regression-evaluation", "evaluation-principles"],
    readTime: 28,
    routes: [
      { label: "Reports", href: "/reports" },
      { label: "Projects", href: "/projects" },
      { label: "Regression", href: "/regression" },
    ],
  },
  {
    role: "AI Engineers",
    focus: "Rubrics, judge behavior, groundedness, claim evidence",
    articles: ["scoring-rubrics", "llm-as-judge", "groundedness"],
    readTime: 34,
    routes: [
      { label: "Rubrics", href: "/rubrics" },
      { label: "Eval Runs", href: "/runs" },
    ],
  },
  {
    role: "Reviewers",
    focus: "Human review, safety findings, overrides",
    articles: ["human-review", "hallucination-risk", "evaluation-reports"],
    readTime: 25,
    routes: [
      { label: "Human Review", href: "/review" },
      { label: "Eval Runs", href: "/runs" },
    ],
  },
  {
    role: "Trust & Safety",
    focus: "Safety gates, false confirmations, PII, unresolved blockers",
    articles: ["human-review", "evaluation-principles", "scoring-rubrics"],
    readTime: 36,
    routes: [
      { label: "Safety Log", href: "/safety" },
      { label: "Human Review", href: "/review" },
    ],
  },
];

export function getArticle(slug: string): WikiArticle | undefined {
  return WIKI_ARTICLES.find((a) => a.slug === slug);
}

export function getAdjacentArticles(slug: string): {
  prev: WikiArticle | null;
  next: WikiArticle | null;
} {
  const sorted = [...WIKI_ARTICLES].sort((a, b) => a.order - b.order);
  const idx = sorted.findIndex((a) => a.slug === slug);
  return {
    prev: idx > 0 ? sorted[idx - 1] : null,
    next: idx < sorted.length - 1 ? sorted[idx + 1] : null,
  };
}

export function getArticlesByCategory(category: WikiArticle["category"]): WikiArticle[] {
  return WIKI_ARTICLES.filter((a) => a.category === category).sort(
    (a, b) => a.order - b.order,
  );
}

export function resolveArticles(slugs: string[]): WikiArticle[] {
  return slugs
    .map((s) => getArticle(s))
    .filter((a): a is WikiArticle => a !== undefined);
}
