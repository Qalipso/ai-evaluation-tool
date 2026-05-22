/**
 * 3-question mini-quizzes per wiki article.
 *
 * Each question has 3–4 options and exactly one correct index.
 * Pass = all 3 correct on a single attempt.
 * Pass state persists in `localStorage` under `WIKI_PASSED_KEY`.
 *
 * Source for questions: the wiki article itself + its source cards.
 * Questions test recognition of the operational rule, not trivia.
 */

export interface QuizQuestion {
  q: string;
  options: string[];
  /** Index into `options` of the correct answer. */
  correct: number;
  /** Short explanation shown after the player answers. */
  why: string;
}

export interface Quiz {
  slug: string;
  questions: QuizQuestion[];
}

export const WIKI_QUIZZES: Quiz[] = [
  {
    slug: "start-here",
    questions: [
      {
        q: "Which of these is NOT one of the six core steps in the tool's workflow?",
        options: [
          "Project → Rubric → Case → Run → Review → Report",
          "Train → Tune → Test → Deploy → Monitor → Retire",
          "All of the above are workflow steps.",
        ],
        correct: 1,
        why: "The workflow is Project → Rubric → Case → Run → Review → Report. Training/tuning is out of scope — this tool evaluates, it does not train.",
      },
      {
        q: "What does the safety gate do when triggered?",
        options: [
          "Lowers the overall score by 10 points.",
          "Blocks `resolved` status regardless of any other dimension score.",
          "Routes the case to a slower judge for re-evaluation.",
        ],
        correct: 1,
        why: "Safety is a gate, not a weight. A medium+ safety finding blocks shipping no matter how high the other dimensions score.",
      },
      {
        q: "When reading an evaluation result, what should you check FIRST?",
        options: [
          "The overall score.",
          "The safety status — open findings block ship.",
          "The judge model version.",
        ],
        correct: 1,
        why: "Safety first. A 95-overall run with an open PII finding is not ship-ready; the overall score is misleading until safety is clean.",
      },
    ],
  },
  {
    slug: "evaluation-principles",
    questions: [
      {
        q: "Why does the tool refuse to display an overall score without the dimension breakdown?",
        options: [
          "Performance reasons — the breakdown is computed lazily.",
          "Because a single number hides axis-specific failures (HELM principle).",
          "To save screen space on the report.",
        ],
        correct: 1,
        why: "Stanford HELM showed that single-score evaluation hides catastrophic failures on other axes. The dimension breakdown is the actual measurement.",
      },
      {
        q: "What is the difference between a hallucination and an ungrounded claim?",
        options: [
          "They are the same thing.",
          "Hallucination = false / invented; ungroundedness = no source in the context (true OR false).",
          "Hallucination is for text, ungroundedness is for code.",
        ],
        correct: 1,
        why: "A claim can be true and ungrounded (model knew it from training), or grounded and hallucinated (model misread the source). The tool tracks them separately.",
      },
      {
        q: "Why is the LLM judge treated as a tool, not as ground truth?",
        options: [
          "Cost — judges are expensive on every case.",
          "Documented biases: fluency, position, verbosity, self-preference; calibration drifts over time.",
          "Judges only work in English.",
        ],
        correct: 1,
        why: "MT-Bench + LLM-as-Judge survey: judges have measurable biases and drift. Rolling calibration against humans is mandatory.",
      },
    ],
  },
  {
    slug: "scoring-rubrics",
    questions: [
      {
        q: "A dimension is 'output is valid JSON matching schema X'. What method should you pick?",
        options: [
          "LLM-as-judge — checks need natural-language reasoning.",
          "Semantic similarity — compare against a reference JSON.",
          "Deterministic — a parser can check it, no judge needed.",
        ],
        correct: 2,
        why: "IFEval: if a requirement can be checked by code, code is cheaper and zero-variance. Asking an LLM for JSON validity adds noise without value.",
      },
      {
        q: "What must an LLM-judge dimension's response always include?",
        options: [
          "Just a score from 0–10.",
          "Score + rationale + (where applicable) evidence pointers.",
          "A confidence interval and a prediction.",
        ],
        correct: 1,
        why: "G-Eval: a structured judge emits score + rationale. The tool elevates this: a score with no rationale is treated as `unscored`.",
      },
      {
        q: "Why are rubric versions immutable once used?",
        options: [
          "Database constraint — versions are primary keys.",
          "So scores across runs remain comparable; editing changes the unit of measure.",
          "Compliance — most regulators require it.",
        ],
        correct: 1,
        why: "A score of 78 under v1.1 is not comparable to 78 under v1.0. Editing creates a new version; old runs keep their original rubric.",
      },
    ],
  },
  {
    slug: "hallucination-risk",
    questions: [
      {
        q: "What is an 'atomic claim'?",
        options: [
          "Any sentence from the AI output.",
          "One subject, one predicate, one truth value — single check unit.",
          "Only claims that include a number.",
        ],
        correct: 1,
        why: "FActScore: atomic = a single checkable proposition. Compound sentences are split before labeling.",
      },
      {
        q: "Which label is the MOST severe in the four-label system?",
        options: [
          "Unsupported",
          "Partially supported",
          "Contradicted",
        ],
        correct: 2,
        why: "Contradicted means the retrieved context says the opposite — shipping it teaches users the inverse of the truth.",
      },
      {
        q: "An output's claim cites doc-2, but doc-2 does not actually say that. What is this called?",
        options: [
          "Stitched fact.",
          "Citation drift / misuse — worse than no citation because it creates false trust.",
          "Confabulated detail.",
        ],
        correct: 1,
        why: "FActScore + ARES: a misused citation creates more harm than no citation. The tool always checks the cited chunk, not the best-matching one.",
      },
    ],
  },
  {
    slug: "groundedness",
    questions: [
      {
        q: "Can a claim be true in the world AND ungrounded at the same time?",
        options: [
          "No — true claims are by definition supported.",
          "Yes — the model knew it from training, but no chunk supports it.",
          "Only for RAG outputs.",
        ],
        correct: 1,
        why: "Groundedness is faithfulness to the source, not truth in the world. An ungrounded-but-true answer still fails the rubric in a docs-only product.",
      },
      {
        q: "What are the three RAG failure surfaces in the TruLens triad?",
        options: [
          "Latency, cost, accuracy.",
          "Context relevance, groundedness, answer relevance.",
          "Retrieval, generation, ranking.",
        ],
        correct: 1,
        why: "TruLens: each surface is its own diagnostic question; failing any one is its own root cause.",
      },
      {
        q: "Why does the tool penalize MISUSE 2× harder than an unsupported claim?",
        options: [
          "Misuse is rarer, so the penalty balances frequency.",
          "Misuse creates false trust — readers see a citation and stop checking.",
          "It is a holdover from the original RAGAS paper.",
        ],
        correct: 1,
        why: "A confident citation pointing to a non-supporting chunk is worse than no citation, because it short-circuits the reader's verification.",
      },
    ],
  },
  {
    slug: "regression-evaluation",
    questions: [
      {
        q: "When is the tool willing to compute a regression report between Run A and Run B?",
        options: [
          "Whenever both runs exist.",
          "Only when same dataset + same rubric version + identical retrieved context.",
          "Whenever the user clicks 'Compare anyway'.",
        ],
        correct: 1,
        why: "Same dataset, same rubric, one variable changed — otherwise the comparison is two unrelated experiments.",
      },
      {
        q: "Run B has +1 overall vs Run A. Per-dimension σ from calibration is 3. Should you ship?",
        options: [
          "Yes — +1 is an improvement.",
          "No — delta is within 2σ noise, statistically not a change.",
          "Yes if cost dropped, otherwise no.",
        ],
        correct: 1,
        why: "Deltas smaller than 2σ are noise. Shipping a 1-point 'improvement' against a 3-point std-dev is shipping LLM-judge variance.",
      },
      {
        q: "What is the recommended way to reduce LLM-judge variance in regression-critical runs?",
        options: [
          "Pick the largest available judge model.",
          "Judge averaging — run the judge N times per case and take the mean.",
          "Use only deterministic dimensions.",
        ],
        correct: 1,
        why: "N samples cut variance by ~√N. The default in regression-critical runs is N=3. Deterministic is even better where possible, but not always feasible.",
      },
    ],
  },
  {
    slug: "llm-as-judge",
    questions: [
      {
        q: "Which of these is a documented LLM-judge bias?",
        options: [
          "Position bias — favors first option in pairwise comparison.",
          "Recency bias — favors newer documents.",
          "Both A and B are documented in MT-Bench.",
        ],
        correct: 0,
        why: "MT-Bench / Chatbot Arena: position, verbosity, and self-preference are the documented biases. Recency is not in that catalogue.",
      },
      {
        q: "Why prefer a judge model from a DIFFERENT family than the model under test?",
        options: [
          "Cross-family judges are cheaper.",
          "Self-preference bias — judges rate their own family higher than competitors.",
          "Different family = better English.",
        ],
        correct: 1,
        why: "Documented in MT-Bench. The tool surfaces a warning when judge + model-under-test are the same family.",
      },
      {
        q: "What is meta-evaluation?",
        options: [
          "Evaluating the model on the meta-properties (cost, latency).",
          "Judging the judge — measuring its agreement with humans on a calibration set, over time.",
          "Running the eval twice and taking the higher score.",
        ],
        correct: 1,
        why: "LLM-as-Judge survey: judges drift. A judge that worked last quarter may not this quarter. Rolling calibration is the only way to know.",
      },
    ],
  },
  {
    slug: "human-review",
    questions: [
      {
        q: "What is the FIRST priority in the review queue?",
        options: [
          "Newest cases first (chronological).",
          "Open safety findings at medium+ severity.",
          "Cases the LLM judge flagged as failing.",
        ],
        correct: 1,
        why: "Chronological queue lets the oldest unsolved problems rot. Safety first, then low-confidence high-weight cases, then disputed, then random.",
      },
      {
        q: "When a reviewer overrides a judge's score, what does the original judge score do?",
        options: [
          "It is deleted and replaced.",
          "It is preserved alongside the override — the case's final score uses the human score.",
          "It becomes the new 'recommendation'.",
        ],
        correct: 1,
        why: "Overrides do not delete history. Both scores are stored so calibration deltas can be computed over time (LLM-as-Judge survey).",
      },
      {
        q: "Why must an override include a required REASON string?",
        options: [
          "For the auditor.",
          "It feeds the calibration log and surfaces systemic judge-vs-human disagreement patterns.",
          "It is a UX nicety, not enforced.",
        ],
        correct: 1,
        why: "Reasons drive the calibration loop. A team that allows reasonless overrides has not added review; it has added noise.",
      },
    ],
  },
  {
    slug: "evaluation-reports",
    questions: [
      {
        q: "What three things must the report enable a stakeholder to answer?",
        options: [
          "Is it good enough to ship? Where does it fail? What changed since last time?",
          "Did we ship on time? Did we hit budget? Did the team get along?",
          "What is the model? What is the prompt? What is the cost?",
        ],
        correct: 0,
        why: "The first three are the audit questions the report exists to answer. If it cannot answer all three, it is a printout, not a report.",
      },
      {
        q: "What must the report header carry to be referenceable later?",
        options: [
          "Project name only.",
          "Project, rubric id + version, dataset id, model, prompt id + version, timestamp, run id.",
          "Just a timestamp.",
        ],
        correct: 1,
        why: "NIST AI RMF + OpenAI Evals: the header is the audit trail. Without it the report cannot be re-rendered or referenced in 6 months.",
      },
      {
        q: "Why does a new human override produce a NEW report version rather than editing the old one?",
        options: [
          "Performance — re-rendering is slow.",
          "Audit guarantee: reports never overwrite reports; old + new are both retrievable.",
          "Bugs — the old report still has the wrong override.",
        ],
        correct: 1,
        why: "NIST AI RMF Manage function: an audit trail requires immutable artifacts. Both versions are preserved; the change history is the integrity surface.",
      },
    ],
  },
];

export const WIKI_PASSED_KEY = "wiki:passed";

export function getQuiz(slug: string): Quiz | undefined {
  return WIKI_QUIZZES.find((q) => q.slug === slug);
}

/** Client-only — reads passed slugs from localStorage. Returns empty set on server. */
export function readPassed(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(WIKI_PASSED_KEY);
    if (!raw) return new Set();
    const arr: unknown = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((v): v is string => typeof v === "string"));
  } catch {
    return new Set();
  }
}

/** Client-only — adds a slug to the passed set. */
export function markPassed(slug: string): void {
  if (typeof window === "undefined") return;
  const passed = readPassed();
  passed.add(slug);
  try {
    window.localStorage.setItem(WIKI_PASSED_KEY, JSON.stringify([...passed]));
    // Fire event so other components on the page can refresh.
    window.dispatchEvent(new CustomEvent("wiki-passed-changed"));
  } catch {
    /* localStorage unavailable */
  }
}
