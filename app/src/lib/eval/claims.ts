import "server-only";
import OpenAI from "openai";
import { z } from "zod";
import { assertWithinBudget, addDailySpend } from "./budget";
import { scoreGroundedness } from "./groundedness";
import type { EvalInput } from "./deterministic";

// Claim pipeline: extract atomic factual claims from the AI output and verify
// each against the retrieved context (groundedness). Real implementation —
// powers the `claim_pipeline` scoring method and the heat map.

const CLAIM_MODEL = process.env.OPENAI_CLAIM_MODEL ?? "gpt-4o-mini";
const COST_PER_1K_INPUT = 0.00015;
const COST_PER_1K_OUTPUT = 0.0006;

export type ClaimLabel = "supported" | "partially_supported" | "unsupported" | "contradicted";

export interface VerifiedClaim {
  text: string;
  label: ClaimLabel;
  confidence: number;
  source_idx: number | null;
  evidence: string;
}

const ClaimSchema = z.object({
  text: z.string().min(2).max(500),
  label: z.enum(["supported", "partially_supported", "unsupported", "contradicted"]),
  confidence: z.number().min(0).max(1),
  source_idx: z.number().int().nullable(),
  evidence: z.string().max(500),
});
const ResponseSchema = z.object({ claims: z.array(ClaimSchema).max(30) });

export interface ClaimPipelineResult {
  claims: VerifiedClaim[];
  score: number; // 0..1 groundedness
  cost_usd: number;
}

function buildSystem(hasContext: boolean): string {
  return `You are a claim-verification engine for RAG evaluation.
1. Extract every atomic factual claim stated in the AI OUTPUT (one verifiable assertion each).
2. ${hasContext
    ? "Classify each claim against the CONTEXT chunks:"
    : "With no context provided, classify each claim on whether it is self-evidently safe to assert or an unsupported external fact:"}
   - supported: fully backed by the context
   - partially_supported: partially backed / needs caveat
   - unsupported: not in the context (or, without context, an external factual claim)
   - contradicted: conflicts with the context
3. Give confidence 0..1, the source_idx of the context chunk used (or null), and short evidence.

Return JSON: { "claims": [ { "text", "label", "confidence", "source_idx", "evidence" } ] }.
If the output makes no factual claims, return an empty array.`;
}

function buildUser(input: EvalInput): string {
  const ctx = input.retrieved_context.length
    ? `CONTEXT:\n${input.retrieved_context.map((c, i) => `[${i}] ${c}`).join("\n")}`
    : "CONTEXT: (none provided)";
  return `${ctx}\n\nAI OUTPUT:\n${input.ai_output}`;
}

export async function runClaimPipeline(input: EvalInput, model?: string): Promise<ClaimPipelineResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");
  await assertWithinBudget();

  const client = new OpenAI({ apiKey });
  const completion = await client.chat.completions.create({
    model: model || CLAIM_MODEL,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: buildSystem(input.retrieved_context.length > 0) },
      { role: "user", content: buildUser(input) },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = ResponseSchema.parse(JSON.parse(raw));

  const inputTokens = completion.usage?.prompt_tokens ?? 0;
  const outputTokens = completion.usage?.completion_tokens ?? 0;
  const cost_usd =
    (inputTokens / 1000) * COST_PER_1K_INPUT + (outputTokens / 1000) * COST_PER_1K_OUTPUT;
  if (cost_usd > 0) await addDailySpend(cost_usd);

  const claims: VerifiedClaim[] = parsed.claims.map((c) => ({
    text: c.text,
    label: c.label,
    confidence: c.confidence,
    source_idx: c.source_idx,
    evidence: c.evidence,
  }));

  const score = scoreGroundedness(claims.map((c) => c.label));

  return { claims, score, cost_usd };
}
