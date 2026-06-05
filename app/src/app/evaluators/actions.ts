"use server";
import { revalidatePath } from "next/cache";
import { hasSupabase } from "@/lib/supabase";
import { saveSettings, type EvalSettings } from "@/lib/db";
import { runClaimPipeline } from "@/lib/evaluators/claimPipeline";
import { runDeterministicChecks } from "@/lib/evaluators/deterministicChecks";
import type {
  ClaimPipelineInput,
  ClaimPipelineResult,
  DeterministicInput,
  DeterministicResult,
} from "@/lib/evaluators/types";

export type SaveResult = { ok: true } | { ok: false; error: string };

// Local pattern-based evaluators — no LLM, no network. Run server-side so the
// playground proves the engine is executing real checks under the hood.
export async function evaluateClaims(input: ClaimPipelineInput): Promise<ClaimPipelineResult> {
  return runClaimPipeline(input);
}

export async function evaluateDeterministic(input: DeterministicInput): Promise<DeterministicResult> {
  return runDeterministicChecks(input);
}

export async function saveEvalSettings(s: EvalSettings): Promise<SaveResult> {
  try {
    if (!hasSupabase()) return { ok: false, error: "Supabase not configured." };
    await saveSettings({
      judge_model: s.judge_model,
      claim_model: s.claim_model,
      claim_threshold: Math.max(0, Math.min(1, Number(s.claim_threshold))),
      det_pii: Boolean(s.det_pii),
      det_false_confirm: Boolean(s.det_false_confirm),
    });
    revalidatePath("/evaluators");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Save failed." };
  }
}
