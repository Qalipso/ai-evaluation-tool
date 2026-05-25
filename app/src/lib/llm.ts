import OpenAI from "openai";
import { z } from "zod";

const HELPFULNESS_PROMPT = `You are an AI output quality evaluator. Score the following AI response on Helpfulness.

Helpfulness measures how well the response addresses the user's need, provides actionable value, and avoids vagueness.

Score on a scale of 1 to 5:
1 - Not helpful. Ignores the question or is entirely off-topic.
2 - Minimally helpful. Addresses topic but gives no actionable value.
3 - Somewhat helpful. Partially addresses the need with limited value.
4 - Helpful. Clearly addresses the need with concrete, usable content.
5 - Highly helpful. Fully addresses the need, anticipates follow-ups, maximizes value.

Return JSON with:
- score: integer 1-5
- rationale: 1-3 sentences explaining the score with specific evidence from the text`;

const HelpfulnessResponseSchema = z.object({
  score: z.number().int().min(1).max(5),
  rationale: z.string().min(20).max(500),
});

export type HelpfulnessResult = {
  score: number;
  rationale: string;
  model: string;
  cost_usd: number;
};

// GPT-4o-mini pricing (input/output per 1M tokens, as of 2026)
const COST_PER_1K_INPUT = 0.00015;
const COST_PER_1K_OUTPUT = 0.0006;

export async function scoreHelpfulness(text: string): Promise<HelpfulnessResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: HELPFULNESS_PROMPT },
      { role: "user", content: text },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = HelpfulnessResponseSchema.parse(JSON.parse(raw));

  const inputTokens = completion.usage?.prompt_tokens ?? 0;
  const outputTokens = completion.usage?.completion_tokens ?? 0;
  const cost_usd =
    (inputTokens / 1000) * COST_PER_1K_INPUT +
    (outputTokens / 1000) * COST_PER_1K_OUTPUT;

  return {
    score: parsed.score,
    rationale: parsed.rationale,
    model: "gpt-4o-mini",
    cost_usd,
  };
}
