"use server";
import { revalidatePath } from "next/cache";
import { getSupabase, hasSupabase } from "@/lib/supabase";
import { fetchCase, fetchRun, fetchRubric } from "@/lib/db";
import { overallScore } from "@/lib/eval/aggregate";
import type { Score } from "@/lib/data";

export type HumanReviewResult = { ok: true; overall: number } | { ok: false; error: string };

// Inline single-dimension human scoring from the run dimension breakdown.
// Upserts just one dim's score (does not touch other human dims).
export async function saveHumanScore(payload: {
  caseId: string;
  dimId: string;
  score: number;
  rationale: string;
}): Promise<HumanReviewResult> {
  try {
    if (!hasSupabase()) return { ok: false, error: "Supabase not configured." };
    const c = await fetchCase(payload.caseId);
    if (!c) return { ok: false, error: "Case not found." };
    const run = await fetchRun(c.run_id);
    const rubric = run ? await fetchRubric(run.rubric_id) : undefined;
    if (!rubric) return { ok: false, error: "Rubric not found." };

    const dim = rubric.dimensions.find((d) => d.id === payload.dimId && d.method === "human");
    if (!dim) return { ok: false, error: "Not a human dimension." };

    const score = Math.max(0, Math.min(1, Number(payload.score)));
    const rationale = (payload.rationale ?? "").trim() || "Human review";
    const threshold_passed = score >= dim.threshold;

    const db = getSupabase();
    await db.from("scores").delete().eq("case_id", payload.caseId).eq("dim_id", payload.dimId);
    const { error: insErr } = await db.from("scores").insert({
      case_id: payload.caseId,
      dim_id: payload.dimId,
      score,
      method: "human",
      rationale,
      threshold_passed,
      ord: c.scores.length,
    });
    if (insErr) return { ok: false, error: `insert score: ${insErr.message}` };

    // Recompute overall over all now-scored dimensions.
    const kept = c.scores.filter((s) => s.dim_id !== payload.dimId);
    const combined: Score[] = [
      ...kept,
      { dim_id: payload.dimId, score, method: "human", rationale, threshold_passed },
    ];
    const scoredDims = rubric.dimensions.filter((d) => combined.some((s) => s.dim_id === d.id));
    const overall = overallScore(scoredDims, combined);

    // Mark reviewed only once every human dim on this case has a score.
    const humanDims = rubric.dimensions.filter((d) => d.method === "human");
    const scoredIds = new Set(combined.map((s) => s.dim_id));
    const allHumanDone = humanDims.every((d) => scoredIds.has(d.id));

    const { error: upErr } = await db
      .from("cases")
      .update({ overall_score: overall, human_review: allHumanDone ? "reviewed" : "pending" })
      .eq("id", payload.caseId);
    if (upErr) return { ok: false, error: `update case: ${upErr.message}` };

    revalidatePath(`/runs/${c.run_id}`);
    revalidatePath(`/cases/${payload.caseId}`);
    revalidatePath("/review");
    return { ok: true, overall };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Save failed." };
  }
}

export async function submitHumanReview(payload: {
  caseId: string;
  reviewer: string;
  scores: { dim_id: string; score: number; rationale: string }[];
}): Promise<HumanReviewResult> {
  try {
    if (!hasSupabase()) return { ok: false, error: "Supabase not configured." };
    const c = await fetchCase(payload.caseId);
    if (!c) return { ok: false, error: "Case not found." };

    const run = await fetchRun(c.run_id);
    const rubric = run ? await fetchRubric(run.rubric_id) : undefined;
    if (!rubric) return { ok: false, error: "Rubric not found." };

    const humanDimIds = new Set(rubric.dimensions.filter((d) => d.method === "human").map((d) => d.id));
    const dimById = new Map(rubric.dimensions.map((d) => [d.id, d]));

    const clean = payload.scores
      .filter((s) => humanDimIds.has(s.dim_id))
      .map((s) => {
        const score = Math.max(0, Math.min(1, Number(s.score)));
        const dim = dimById.get(s.dim_id)!;
        return {
          dim_id: s.dim_id,
          score,
          rationale: (s.rationale ?? "").trim() || "Human review",
          threshold_passed: score >= dim.threshold,
        };
      });

    if (clean.length === 0) return { ok: false, error: "No human dimensions to score." };

    const db = getSupabase();

    // Remove any prior human scores for these dims on this case (idempotent re-review).
    await db.from("scores").delete().eq("case_id", payload.caseId).in("dim_id", [...humanDimIds]);

    const baseOrd = c.scores.length;
    const { error: insErr } = await db.from("scores").insert(
      clean.map((s, i) => ({
        case_id: payload.caseId,
        dim_id: s.dim_id,
        score: s.score,
        method: "human",
        rationale: s.rationale,
        threshold_passed: s.threshold_passed,
        ord: baseOrd + i,
      })),
    );
    if (insErr) return { ok: false, error: `insert scores: ${insErr.message}` };

    // Recompute overall over all now-scored dimensions.
    const keptAuto = c.scores.filter((s) => !humanDimIds.has(s.dim_id));
    const combined: Score[] = [
      ...keptAuto,
      ...clean.map((s) => ({ dim_id: s.dim_id, score: s.score, method: "human", rationale: s.rationale, threshold_passed: s.threshold_passed })),
    ];
    const scoredDims = rubric.dimensions.filter((d) => combined.some((s) => s.dim_id === d.id));
    const overall = overallScore(scoredDims, combined);

    const { error: upErr } = await db
      .from("cases")
      .update({ overall_score: overall, human_review: `reviewed by ${payload.reviewer || "reviewer"}` })
      .eq("id", payload.caseId);
    if (upErr) return { ok: false, error: `update case: ${upErr.message}` };

    revalidatePath("/review");
    revalidatePath(`/cases/${payload.caseId}`);
    revalidatePath(`/runs/${c.run_id}`);
    revalidatePath("/");

    return { ok: true, overall };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Review failed." };
  }
}
