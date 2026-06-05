"use server";
import { revalidatePath } from "next/cache";
import { hasSupabase } from "@/lib/supabase";
import { saveSettings, type EvalSettings } from "@/lib/db";

export type SaveResult = { ok: true } | { ok: false; error: string };

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
