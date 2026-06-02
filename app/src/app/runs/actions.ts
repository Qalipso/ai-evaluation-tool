"use server";
import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { hasSupabase } from "@/lib/supabase";
import { dbDeleteRun } from "@/lib/db";
import { evaluateCase } from "@/lib/eval/run";

const runsPath = path.join(process.cwd(), "mock-data", "runs.json");
const casesPath = path.join(process.cwd(), "mock-data", "cases.json");

const MAX_OUTPUT_CHARS = 8000;

export type RunEvalResult =
  | { ok: true; case_id: string; overall_score: number; verdict: string; cost_usd: number }
  | { ok: false; error: string };

export async function runEvaluation(formData: FormData): Promise<RunEvalResult> {
  try {
    const project_id = (formData.get("project_id") as string)?.trim();
    const rubric_id = (formData.get("rubric_id") as string)?.trim();
    const input = (formData.get("input") as string)?.trim() ?? "";
    const expected_behavior = (formData.get("expected_behavior") as string)?.trim() ?? "";
    const ai_output = (formData.get("ai_output") as string)?.trim() ?? "";
    const ctxRaw = (formData.get("retrieved_context") as string) ?? "";
    const retrieved_context = ctxRaw.split("\n").map((s) => s.trim()).filter(Boolean);

    if (!project_id || !rubric_id) return { ok: false, error: "Project and rubric are required." };
    if (!ai_output) return { ok: false, error: "AI output is required." };
    if (ai_output.length > MAX_OUTPUT_CHARS)
      return { ok: false, error: `AI output must be ${MAX_OUTPUT_CHARS} characters or fewer.` };

    const res = await evaluateCase({
      project_id,
      rubric_id,
      input,
      expected_behavior,
      ai_output,
      retrieved_context,
    });

    revalidatePath("/runs");
    revalidatePath("/");
    revalidatePath("/compare");

    return {
      ok: true,
      case_id: res.case_id,
      overall_score: res.overall_score,
      verdict: res.verdict,
      cost_usd: res.cost_usd,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Evaluation failed." };
  }
}

export async function deleteRun(id: string) {
  if (hasSupabase()) {
    await dbDeleteRun(id);
  } else {
    const runs: unknown[] = JSON.parse(fs.readFileSync(runsPath, "utf-8"));
    const cases: unknown[] = JSON.parse(fs.readFileSync(casesPath, "utf-8"));
    fs.writeFileSync(
      runsPath,
      JSON.stringify(runs.filter((r) => (r as { id: string }).id !== id), null, 2),
    );
    fs.writeFileSync(
      casesPath,
      JSON.stringify(cases.filter((c) => (c as { run_id: string }).run_id !== id), null, 2),
    );
  }

  revalidatePath("/runs");
  revalidatePath("/");
  revalidatePath("/compare");
}
