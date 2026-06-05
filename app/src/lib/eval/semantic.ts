import "server-only";
import OpenAI from "openai";
import { assertWithinBudget, addDailySpend } from "./budget";

// Real semantic similarity: cosine between embeddings of the AI output and a
// reference (expected behavior). No LLM judge, no fabricated number.

const EMBED_MODEL = process.env.OPENAI_EMBED_MODEL ?? "text-embedding-3-small";
const COST_PER_1K = 0.00002; // text-embedding-3-small

export interface SemanticResult {
  score: number; // 0..1 (cosine clamped)
  cost_usd: number;
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export async function scoreSemanticSimilarity(
  output: string,
  reference: string,
  model?: string,
): Promise<SemanticResult> {
  // Without a reference there is nothing to compare against — treat as unscored.
  if (!reference.trim() || !output.trim()) return { score: 0, cost_usd: 0 };

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");
  await assertWithinBudget();

  const client = new OpenAI({ apiKey });
  const res = await client.embeddings.create({
    model: model || EMBED_MODEL,
    input: [output, reference],
  });

  const [a, b] = res.data.map((d) => d.embedding as number[]);
  const sim = Math.max(0, Math.min(1, cosine(a, b)));

  const tokens = res.usage?.total_tokens ?? 0;
  const cost_usd = (tokens / 1000) * COST_PER_1K;
  if (cost_usd > 0) await addDailySpend(cost_usd);

  return { score: Math.round(sim * 100) / 100, cost_usd };
}
