import "server-only";
import OpenAI from "openai";
import { z } from "zod";
import { assertWithinBudget, addDailySpend } from "./budget";

// Assisted-run helpers: generate eval questions from a rubric, and generate a
// candidate answer for a question using a master (system) prompt + context.
// Both call a real model and count against the daily budget.

const GEN_MODEL = process.env.OPENAI_GEN_MODEL ?? "gpt-4o-mini";
const COST_PER_1K_INPUT = 0.00015;
const COST_PER_1K_OUTPUT = 0.0006;

function cost(usage: { prompt_tokens?: number; completion_tokens?: number } | undefined): number {
  const i = usage?.prompt_tokens ?? 0;
  const o = usage?.completion_tokens ?? 0;
  return (i / 1000) * COST_PER_1K_INPUT + (o / 1000) * COST_PER_1K_OUTPUT;
}

function client(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");
  return new OpenAI({ apiKey });
}

function contextBlock(context: string[]): string {
  return context.length
    ? `\n\nCONTEXT (source material the assistant may use):\n${context.map((c, i) => `[${i}] ${c}`).join("\n")}`
    : "";
}

// ── Generate test questions from a rubric ────────────────────────────────────
export interface GenDim {
  id: string;
  name: string;
}
export interface GeneratedQuestion {
  question: string;
  expected_behavior: string;
}

const QuestionsSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string().min(3).max(500),
        expected_behavior: z.string().min(3).max(600),
      }),
    )
    .min(1)
    .max(12),
});

export async function generateQuestions(args: {
  rubricName: string;
  dims: GenDim[];
  masterPrompt: string;
  context: string[];
  count: number;
  model?: string;
}): Promise<{ questions: GeneratedQuestion[]; cost_usd: number }> {
  await assertWithinBudget();

  const dimList = args.dims.map((d) => `- ${d.name} (${d.id})`).join("\n");
  const system = `You design evaluation test cases for an AI assistant.
Given the assistant's master prompt and a scoring rubric, produce ${args.count} diverse user questions that would stress the rubric's dimensions (including edge cases and likely failure modes). For each question, state the expected behavior a good answer should show.

Rubric "${args.rubricName}" dimensions:
${dimList}

Return JSON: { "questions": [ { "question": string, "expected_behavior": string } ] } with exactly ${args.count} items.`;

  const user = `ASSISTANT MASTER PROMPT:\n${args.masterPrompt || "(none provided)"}${contextBlock(args.context)}`;

  const completion = await client().chat.completions.create({
    model: args.model || GEN_MODEL,
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = QuestionsSchema.parse(JSON.parse(raw));
  const c = cost(completion.usage);
  if (c > 0) await addDailySpend(c);
  return { questions: parsed.questions, cost_usd: c };
}

// ── Generate a candidate answer for one question ─────────────────────────────
export async function generateAnswer(args: {
  masterPrompt: string;
  question: string;
  context: string[];
  model?: string;
}): Promise<{ answer: string; cost_usd: number }> {
  await assertWithinBudget();

  const system = args.masterPrompt?.trim()
    ? args.masterPrompt
    : "You are a helpful assistant. Answer the user's question clearly and concisely.";
  const user = `${args.question}${contextBlock(args.context)}`;

  const completion = await client().chat.completions.create({
    model: args.model || GEN_MODEL,
    temperature: 0.3,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const answer = completion.choices[0]?.message?.content?.trim() ?? "";
  const c = cost(completion.usage);
  if (c > 0) await addDailySpend(c);
  return { answer, cost_usd: c };
}
