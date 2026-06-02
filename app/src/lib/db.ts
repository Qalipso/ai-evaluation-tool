import "server-only";
import { getSupabase, hasSupabase } from "./supabase";
import type { Project, Rubric, Run, Case, AIModel } from "./data";

// Data access layer.
// Supabase-backed when SUPABASE_* env is set; otherwise falls back to the
// bundled mock-data JSON so the app still renders in dev/CI without creds.

import projectsJson from "../../mock-data/projects.json";
import rubricsJson from "../../mock-data/rubrics.json";
import runsJson from "../../mock-data/runs.json";
import casesJson from "../../mock-data/cases.json";
import modelsJson from "../../mock-data/models.json";

const jsonProjects = projectsJson as unknown as Project[];
const jsonRubrics = rubricsJson as unknown as Rubric[];
const jsonRuns = runsJson as unknown as Run[];
const jsonCases = casesJson as unknown as Case[];
const jsonModels = modelsJson as unknown as AIModel[];

// ─── Row → domain mappers (reassemble nested shapes) ─────────────────────────
type DimRow = { dim_key: string; name: string; method: string; weight: number; threshold: number; ord: number };
function mapRubric(r: Record<string, unknown>): Rubric {
  const dims = ((r.dimensions as DimRow[]) ?? [])
    .slice()
    .sort((a, b) => a.ord - b.ord)
    .map((d) => ({ id: d.dim_key, name: d.name, method: d.method, weight: Number(d.weight), threshold: Number(d.threshold) }));
  return {
    id: r.id as string,
    name: r.name as string,
    version: r.version as string,
    owner: r.owner as string,
    project_id: (r.project_id as string) ?? "",
    updated: (r.updated as string) ?? "",
    dimensions: dims,
    safety_gates: (r.safety_gates as string[]) ?? [],
  };
}

type ChildRow = { ord: number };
function sortByOrd<T extends ChildRow>(rows: T[] | undefined): T[] {
  return (rows ?? []).slice().sort((a, b) => a.ord - b.ord);
}
function mapCase(c: Record<string, unknown>): Case {
  return {
    id: c.id as string,
    run_id: c.run_id as string,
    input: (c.input as string) ?? "",
    expected_behavior: (c.expected_behavior as string) ?? "",
    ai_output: (c.ai_output as string) ?? "",
    retrieved_context: (c.retrieved_context as string[]) ?? [],
    overall_score: Number(c.overall_score ?? 0),
    human_review: (c.human_review as string | null) ?? null,
    scores: sortByOrd(c.scores as (ChildRow & Record<string, unknown>)[]).map((s) => ({
      dim_id: s.dim_id as string,
      score: Number(s.score),
      method: s.method as string,
      rationale: (s.rationale as string) ?? "",
      threshold_passed: Boolean(s.threshold_passed),
    })),
    claims: sortByOrd(c.claims as (ChildRow & Record<string, unknown>)[]).map((cl) => ({
      text: cl.text as string,
      label: cl.label as string,
      confidence: Number(cl.confidence),
      source_idx: (cl.source_idx as number | null) ?? null,
      evidence: (cl.evidence as string) ?? "",
    })),
    safety_findings: sortByOrd(c.safety_findings as (ChildRow & Record<string, unknown>)[]).map((f) => ({
      category: f.category as string,
      severity: f.severity as string,
      evidence: (f.evidence as string) ?? "",
      status: f.status as string,
    })),
  };
}

const RUBRIC_SELECT = "*, dimensions(*)";
const CASE_SELECT = "*, scores(*), claims(*), safety_findings(*)";

// ─── Fetchers ────────────────────────────────────────────────────────────────
export async function fetchModels(): Promise<AIModel[]> {
  if (!hasSupabase()) return jsonModels;
  const { data, error } = await getSupabase().from("models").select("*").order("id");
  if (error) throw new Error(`fetchModels: ${error.message}`);
  return (data ?? []) as AIModel[];
}

export async function fetchProjects(): Promise<Project[]> {
  if (!hasSupabase()) return jsonProjects;
  const { data, error } = await getSupabase().from("projects").select("*").order("id");
  if (error) throw new Error(`fetchProjects: ${error.message}`);
  return (data ?? []) as Project[];
}

export async function fetchProject(id: string): Promise<Project | undefined> {
  if (!hasSupabase()) return jsonProjects.find((p) => p.id === id);
  const { data } = await getSupabase().from("projects").select("*").eq("id", id).maybeSingle();
  return (data as Project) ?? undefined;
}

export async function fetchRubrics(): Promise<Rubric[]> {
  if (!hasSupabase()) return jsonRubrics;
  const { data, error } = await getSupabase().from("rubrics").select(RUBRIC_SELECT).order("id");
  if (error) throw new Error(`fetchRubrics: ${error.message}`);
  return (data ?? []).map((r) => mapRubric(r as Record<string, unknown>));
}

export async function fetchRubric(id: string): Promise<Rubric | undefined> {
  if (!hasSupabase()) return jsonRubrics.find((r) => r.id === id);
  const { data } = await getSupabase().from("rubrics").select(RUBRIC_SELECT).eq("id", id).maybeSingle();
  return data ? mapRubric(data as Record<string, unknown>) : undefined;
}

export async function fetchRuns(): Promise<Run[]> {
  if (!hasSupabase()) return jsonRuns;
  const { data, error } = await getSupabase().from("runs").select("*").order("started_at", { ascending: false });
  if (error) throw new Error(`fetchRuns: ${error.message}`);
  return (data ?? []) as Run[];
}

export async function fetchRun(id: string): Promise<Run | undefined> {
  if (!hasSupabase()) return jsonRuns.find((r) => r.id === id);
  const { data } = await getSupabase().from("runs").select("*").eq("id", id).maybeSingle();
  return (data as Run) ?? undefined;
}

export async function fetchCases(): Promise<Case[]> {
  if (!hasSupabase()) return jsonCases;
  const { data, error } = await getSupabase().from("cases").select(CASE_SELECT);
  if (error) throw new Error(`fetchCases: ${error.message}`);
  return (data ?? []).map((c) => mapCase(c as Record<string, unknown>));
}

export async function fetchCase(id: string): Promise<Case | undefined> {
  if (!hasSupabase()) return jsonCases.find((c) => c.id === id);
  const { data } = await getSupabase().from("cases").select(CASE_SELECT).eq("id", id).maybeSingle();
  return data ? mapCase(data as Record<string, unknown>) : undefined;
}

export async function fetchCasesByRun(runId: string): Promise<Case[]> {
  if (!hasSupabase()) return jsonCases.filter((c) => c.run_id === runId);
  const { data, error } = await getSupabase().from("cases").select(CASE_SELECT).eq("run_id", runId);
  if (error) throw new Error(`fetchCasesByRun: ${error.message}`);
  return (data ?? []).map((c) => mapCase(c as Record<string, unknown>));
}

// ─── Mutations (Supabase only; callers guard with hasSupabase) ───────────────
export async function dbUpsertProject(row: Record<string, unknown>): Promise<void> {
  const { error } = await getSupabase().from("projects").upsert(row, { onConflict: "id" });
  if (error) throw new Error(`dbUpsertProject: ${error.message}`);
}

export async function dbDeleteProject(id: string): Promise<void> {
  const { error } = await getSupabase().from("projects").delete().eq("id", id);
  if (error) throw new Error(`dbDeleteProject: ${error.message}`);
}

export async function dbUpsertModel(row: { id: string; provider: string; label: string }): Promise<void> {
  const { error } = await getSupabase().from("models").upsert(row, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw new Error(`dbUpsertModel: ${error.message}`);
}

export async function dbUpsertRubric(rubric: Rubric): Promise<void> {
  const db = getSupabase();
  const { error: rErr } = await db.from("rubrics").upsert(
    {
      id: rubric.id,
      name: rubric.name,
      version: rubric.version,
      owner: rubric.owner,
      project_id: rubric.project_id || null,
      updated: rubric.updated,
      safety_gates: rubric.safety_gates,
    },
    { onConflict: "id" },
  );
  if (rErr) throw new Error(`dbUpsertRubric: ${rErr.message}`);

  await db.from("dimensions").delete().eq("rubric_id", rubric.id);
  if (rubric.dimensions.length) {
    const dims = rubric.dimensions.map((d, i) => ({
      rubric_id: rubric.id,
      dim_key: d.id,
      name: d.name,
      method: d.method,
      weight: d.weight,
      threshold: d.threshold,
      ord: i,
    }));
    const { error: dErr } = await db.from("dimensions").insert(dims);
    if (dErr) throw new Error(`dbUpsertRubric dims: ${dErr.message}`);
  }
}

export async function dbDeleteRubric(id: string): Promise<void> {
  const { error } = await getSupabase().from("rubrics").delete().eq("id", id);
  if (error) throw new Error(`dbDeleteRubric: ${error.message}`);
}

export async function dbDeleteRun(id: string): Promise<void> {
  // cases cascade-delete via FK
  const { error } = await getSupabase().from("runs").delete().eq("id", id);
  if (error) throw new Error(`dbDeleteRun: ${error.message}`);
}

export async function dbExistsProject(id: string): Promise<boolean> {
  const { data } = await getSupabase().from("projects").select("id").eq("id", id).maybeSingle();
  return Boolean(data);
}

export async function dbExistsRubric(id: string): Promise<boolean> {
  const { data } = await getSupabase().from("rubrics").select("id").eq("id", id).maybeSingle();
  return Boolean(data);
}
