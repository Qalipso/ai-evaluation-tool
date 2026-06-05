"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasSupabase } from "@/lib/supabase";
import { dbCreateDataset, dbDeleteDataset } from "@/lib/db";

export type SaveDatasetResult = { ok: true; id: string } | { ok: false; error: string };

export async function saveDataset(payload: {
  project_id: string;
  name: string;
  cases: { input: string; expected_behavior: string; expected_language?: string | null }[];
}): Promise<SaveDatasetResult> {
  try {
    if (!hasSupabase()) return { ok: false, error: "Supabase not configured." };
    const name = payload.name?.trim();
    if (!name) return { ok: false, error: "Name is required." };
    const cases = (payload.cases ?? [])
      .map((c) => ({
        input: (c.input ?? "").trim(),
        expected_behavior: (c.expected_behavior ?? "").trim(),
        expected_language: c.expected_language ?? null,
        difficulty: "medium",
        category: [] as string[],
        is_critical: false,
        tags: [] as string[],
      }))
      .filter((c) => c.input);
    if (cases.length === 0) return { ok: false, error: "No cases to save." };

    const { id } = await dbCreateDataset({
      project_id: payload.project_id,
      name,
      source: "llm",
      cases,
    });
    revalidatePath("/datasets");
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Save failed." };
  }
}

export async function deleteDataset(id: string) {
  if (hasSupabase()) await dbDeleteDataset(id);
  revalidatePath("/datasets");
  redirect("/datasets");
}
