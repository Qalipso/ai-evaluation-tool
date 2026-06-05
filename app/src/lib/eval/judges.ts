import "server-only";
import OpenAI from "openai";
import { z } from "zod";
import { criteriaFor } from "./dimensions";
import type { EvalInput } from "./deterministic";

// LLM-as-judge. One structured call scores every LLM dimension of a rubric at
// once — cheaper and lower-latency than one call per dimension. temperature 0
// for stability (variance is still reported, never hidden).

const JUDGE_MODEL = process.env.OPENAI_JUDGE_MODEL ?? "gpt-4o-mini";

// gpt-4o-mini pricing per 1K tokens
const COST_PER_1K_INPUT = 0.00015;
const COST_PER_1K_OUTPUT = 0.0006;

export interface JudgeDimension {
  id: string; // dim_key
  name: string;
}

export interface JudgeScore {
  dim_id: string;
  score: number; // normalized 0..1
  rationale: string;
}

export interface JudgeResult {
  scores: JudgeScore[];
  model: string;
  cost_usd: number;
}

const ItemSchema = z.object({
  dim_id: z.string(),
  score: z.number().int().min(1).max(5),
  rationale: z.string().min(5).max(600),
});
const ResponseSchema = z.object({ scores: z.array(ItemSchema) });

function buildPrompt(dims: JudgeDimension[]): string {
  const lines = dims.map((d) => `- ${d.id}: ${criteriaFor(d.id, d.name)}`).join("\n");
  return `You are an AI output quality evaluator. Score the AI response on each dimension below.

Dimensions:
${lines}

Score each on an integer scale of 1 to 5:
1 = fails the dimension entirely
3 = partially meets it
5 = fully meets it, no issues

Return JSON: { "scores": [ { "dim_id": string, "score": 1-5, "rationale": "1-2 sentences citing specific evidence" } ] }
Include exactly one entry per dimension listed above, using the dim_id verbatim.`;
}

function buildUserContent(input: EvalInput): string {
  const ctx = input.retrieved_context.length
    ? `\n\nRETRIEVED CONTEXT:\n${input.retrieved_context.map((c, i) => `[${i}] ${c}`).join("\n")}`
    : "";
  return `USER INPUT:\n${input.input}\n\nEXPECTED BEHAVIOR:\n${input.expected_behavior}\n\nAI OUTPUT:\n${input.ai_output}${ctx}`;
}

export async function scoreWithJudge(
  dims: JudgeDimension[],
  input: EvalInput,
  model?: string,
): Promise<JudgeResult> {
  const useModel = model || JUDGE_MODEL;
  if (dims.length === 0) return { scores: [], model: useModel, cost_usd: 0 };

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const client = new OpenAI({ apiKey });
  const completion = await client.chat.completions.create({
    model: useModel,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: buildPrompt(dims) },
      { role: "user", content: buildUserContent(input) },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = ResponseSchema.parse(JSON.parse(raw));

  const inputTokens = completion.usage?.prompt_tokens ?? 0;
  const outputTokens = completion.usage?.completion_tokens ?? 0;
  const cost_usd =
    (inputTokens / 1000) * COST_PER_1K_INPUT + (outputTokens / 1000) * COST_PER_1K_OUTPUT;

  // Normalize 1-5 → 0..1 and keep only requested dims.
  const wanted = new Set(dims.map((d) => d.id));
  const scores: JudgeScore[] = parsed.scores
    .filter((s) => wanted.has(s.dim_id))
    .map((s) => ({ dim_id: s.dim_id, score: (s.score - 1) / 4, rationale: s.rationale }));

  return { scores, model: useModel, cost_usd };
}
