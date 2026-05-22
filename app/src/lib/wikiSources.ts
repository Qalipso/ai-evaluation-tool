export type WikiSourceType =
  | "paper"
  | "official-docs"
  | "standard"
  | "framework"
  | "benchmark";

export interface WikiSource {
  id: string;
  title: string;
  type: WikiSourceType;
  /** Primary URL (paper, official docs, or canonical project page). */
  url: string;
  /** Wiki slugs where this source backs claims. */
  usedFor: string[];
  /** 2–4 short phrases describing the concepts contributed. */
  concepts: string[];
  /** One-sentence summary of how the source maps to product behavior. */
  appliedTo: string;
}

/**
 * Curated set of primary sources backing the Wiki.
 * Each entry is documented in detail in `wiki/sources/source-cards.md`.
 * Cross-referenced in `wiki/sources/source-to-wiki-map.md`.
 *
 * Ordering is stable: do not reorder unless you also re-check `sourceIds`
 * usage in `lib/wiki.ts`.
 */
export const WIKI_SOURCES: WikiSource[] = [
  {
    id: "helm",
    title: "Stanford HELM",
    type: "framework",
    url: "https://crfm.stanford.edu/helm/",
    usedFor: ["evaluation-principles", "scoring-rubrics", "regression-evaluation"],
    concepts: [
      "multi-dimensional evaluation",
      "no single global score",
      "per-dimension thresholds",
      "transparent benchmark scenarios",
    ],
    appliedTo:
      "Justifies the refusal to display an overall score without the per-dimension breakdown.",
  },
  {
    id: "openai-evals",
    title: "OpenAI Evals",
    type: "framework",
    url: "https://github.com/openai/evals",
    usedFor: [
      "start-here",
      "evaluation-principles",
      "scoring-rubrics",
      "regression-evaluation",
      "evaluation-reports",
    ],
    concepts: [
      "datasets + graders + runs as artifacts",
      "deterministic / model-graded / human graders",
      "pinned configuration for comparison",
    ],
    appliedTo:
      "Maps to the tool's three scoring methods and to the immutable-run + pinned-config rules.",
  },
  {
    id: "anthropic-evals",
    title: "Anthropic Evaluation Documentation",
    type: "official-docs",
    url: "https://docs.claude.com/en/docs/test-and-evaluate/develop-tests",
    usedFor: ["start-here", "evaluation-principles", "scoring-rubrics"],
    concepts: [
      "define success criteria before iterating",
      "build the eval first",
      "rubric as prior, score as posterior",
    ],
    appliedTo:
      "Justifies the rule that a rubric must exist and be activated before scoring.",
  },
  {
    id: "langsmith",
    title: "LangSmith Evaluation Concepts",
    type: "official-docs",
    url: "https://docs.smith.langchain.com/evaluation/concepts",
    usedFor: ["start-here", "regression-evaluation", "evaluation-reports"],
    concepts: [
      "dataset / evaluator / run primitives",
      "offline vs online evaluation",
      "same-dataset rule for comparison",
    ],
    appliedTo:
      "Grounds the Project → Rubric → Case → Run → Review → Report workflow.",
  },
  {
    id: "g-eval",
    title: "G-Eval",
    type: "paper",
    url: "https://arxiv.org/abs/2303.16634",
    usedFor: ["scoring-rubrics", "llm-as-judge"],
    concepts: [
      "structured LLM-judge prompts",
      "score + rationale",
      "chain-of-thought reasoning in the judge",
    ],
    appliedTo:
      "Justifies the required JSON judge response shape (`score`, `rationale`, `evidence`).",
  },
  {
    id: "mt-bench-judge",
    title: "MT-Bench / Chatbot Arena: Judging LLM-as-a-Judge",
    type: "paper",
    url: "https://arxiv.org/abs/2306.05685",
    usedFor: [
      "llm-as-judge",
      "human-review",
      "evaluation-principles",
      "hallucination-risk",
      "regression-evaluation",
      "evaluation-reports",
    ],
    concepts: [
      "position bias",
      "verbosity / length bias",
      "self-preference bias",
      "partial human-judge agreement",
    ],
    appliedTo:
      "Backs the explicit LLM-judge failure-mode list and the cross-family judge recommendation.",
  },
  {
    id: "llm-judge-survey",
    title: "LLM-as-a-Judge Survey",
    type: "paper",
    url: "https://arxiv.org/abs/2411.15594",
    usedFor: [
      "llm-as-judge",
      "evaluation-principles",
      "human-review",
      "regression-evaluation",
    ],
    concepts: [
      "pointwise / pairwise / listwise judge modes",
      "meta-evaluation",
      "rolling calibration",
      "calibration drift",
    ],
    appliedTo:
      "Justifies the calibration loop, the drift alert, and human review priority on uncertainty.",
  },
  {
    id: "ragas",
    title: "RAGAS",
    type: "framework",
    url: "https://docs.ragas.io",
    usedFor: ["groundedness", "scoring-rubrics"],
    concepts: [
      "faithfulness",
      "answer relevancy",
      "context precision",
      "context recall",
    ],
    appliedTo:
      "Maps to separate `groundedness_score`, `relevance`, and retrieval-quality signals.",
  },
  {
    id: "ares",
    title: "ARES",
    type: "paper",
    url: "https://arxiv.org/abs/2311.09476",
    usedFor: ["groundedness"],
    concepts: [
      "lightweight RAG judges",
      "answer faithfulness with confidence",
      "citation correctness verification",
    ],
    appliedTo:
      "Backs the misuse check (cited chunk vs claim) and judge-averaging for variance reduction.",
  },
  {
    id: "trulens-triad",
    title: "TruLens RAG Triad",
    type: "framework",
    url: "https://www.trulens.org/getting_started/core_concepts/rag_triad/",
    usedFor: ["groundedness"],
    concepts: [
      "context relevance",
      "groundedness",
      "answer relevance",
      "separable RAG failure surfaces",
    ],
    appliedTo:
      "Justifies the three-way split between answer faithfulness, retrieval utilization, and answer relevance.",
  },
  {
    id: "factscore",
    title: "FActScore",
    type: "paper",
    url: "https://arxiv.org/abs/2305.14251",
    usedFor: ["hallucination-risk", "groundedness"],
    concepts: [
      "atomic claim extraction",
      "claim-level support labels",
      "per-claim evidence",
    ],
    appliedTo:
      "Backs the four-label system (`supported`, `partially_supported`, `unsupported`, `contradicted`).",
  },
  {
    id: "truthfulqa",
    title: "TruthfulQA",
    type: "benchmark",
    url: "https://arxiv.org/abs/2109.07958",
    usedFor: ["hallucination-risk"],
    concepts: [
      "imitative falsehoods",
      "truthfulness vs informativeness tradeoff",
      "confident wrongness",
    ],
    appliedTo:
      "Justifies the 'false confidence' hallucination flavor as distinct from 'invented fact'.",
  },
  {
    id: "selfcheckgpt",
    title: "SelfCheckGPT",
    type: "paper",
    url: "https://arxiv.org/abs/2303.08896",
    usedFor: ["hallucination-risk", "llm-as-judge"],
    concepts: [
      "black-box hallucination detection",
      "consistency across samples as a signal",
      "variance-based flagging",
    ],
    appliedTo:
      "Supports the 'low confidence run' advisory and judge-averaging variance signal.",
  },
  {
    id: "ifeval",
    title: "IFEval",
    type: "benchmark",
    url: "https://arxiv.org/abs/2311.07911",
    usedFor: ["scoring-rubrics", "regression-evaluation"],
    concepts: [
      "verifiable instruction-following constraints",
      "deterministic checks",
      "rule-based assertions",
    ],
    appliedTo:
      "Justifies the deterministic scoring method for verifiable requirements.",
  },
  {
    id: "nist-ai-rmf",
    title: "NIST AI Risk Management Framework / GenAI Profile",
    type: "standard",
    url: "https://www.nist.gov/itl/ai-risk-management-framework",
    usedFor: [
      "evaluation-principles",
      "human-review",
      "evaluation-reports",
    ],
    concepts: [
      "Govern / Map / Measure / Manage",
      "evidence artifacts",
      "red-teaming as part of measurement",
      "audit trail",
    ],
    appliedTo:
      "Justifies safety-as-gate, immutable reports, override audit trail, and the calibration loop.",
  },
  {
    id: "owasp-llm-top10",
    title: "OWASP Top 10 for LLM Applications",
    type: "standard",
    url: "https://genai.owasp.org/llm-top-10/",
    usedFor: [
      "human-review",
      "evaluation-principles",
      "evaluation-reports",
      "scoring-rubrics",
    ],
    concepts: [
      "prompt injection",
      "sensitive information disclosure",
      "insecure output handling",
      "excessive agency",
      "system prompt leakage",
    ],
    appliedTo:
      "Defines the safety categories the tool gates on; cannot be averaged into quality scores.",
  },
  {
    id: "mitre-atlas",
    title: "MITRE ATLAS",
    type: "standard",
    url: "https://atlas.mitre.org/",
    usedFor: ["human-review", "evaluation-principles"],
    concepts: [
      "adversarial tactics against AI systems",
      "ATT&CK-style attack chains",
      "targeted red-teaming",
    ],
    appliedTo:
      "Informs adversarial cases in the dataset and targeted review of those cases.",
  },
];

export function getSource(id: string): WikiSource | undefined {
  return WIKI_SOURCES.find((s) => s.id === id);
}

export function getSourcesForArticle(slug: string): WikiSource[] {
  return WIKI_SOURCES.filter((s) => s.usedFor.includes(slug));
}

export function resolveSources(ids: string[]): WikiSource[] {
  return ids
    .map((id) => getSource(id))
    .filter((s): s is WikiSource => s !== undefined);
}

export function sourceCount(slug: string): number {
  return getSourcesForArticle(slug).length;
}
