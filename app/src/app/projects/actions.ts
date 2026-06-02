"use server";
import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasSupabase } from "@/lib/supabase";
import { dbUpsertProject, dbDeleteProject, dbUpsertModel, dbExistsProject } from "@/lib/db";

const projectsPath = path.join(process.cwd(), "mock-data", "projects.json");
const modelsPath = path.join(process.cwd(), "mock-data", "models.json");

function readModels(): { id: string; provider: string; label: string }[] {
  const raw = fs.readFileSync(modelsPath, "utf-8").trim();
  return raw ? JSON.parse(raw) : [];
}

function readProjects(): unknown[] {
  const raw = fs.readFileSync(projectsPath, "utf-8").trim();
  return raw ? JSON.parse(raw) : [];
}

function writeProjects(data: unknown[]) {
  fs.writeFileSync(projectsPath, JSON.stringify(data, null, 2));
}

export async function createProject(formData: FormData) {
  const id = (formData.get("id") as string).trim().toLowerCase().replace(/\s+/g, "-");
  const name = (formData.get("name") as string).trim();
  const description = (formData.get("description") as string).trim();
  const owner = (formData.get("owner") as string).trim();
  const model = (formData.get("model") as string).trim();
  const active_rubric = (formData.get("active_rubric") as string).trim();
  const cases_total = Number(formData.get("cases_total")) || 0;

  if (!id || !name) throw new Error("id and name are required");

  const row = { id, name, description, owner, model, active_rubric, cases_total };

  if (hasSupabase()) {
    if (await dbExistsProject(id)) throw new Error(`Project id "${id}" already exists`);
    await dbUpsertProject(row);
  } else {
    const projects = readProjects() as Record<string, unknown>[];
    if (projects.some((p) => p["id"] === id)) throw new Error(`Project id "${id}" already exists`);
    projects.push(row);
    writeProjects(projects);
  }

  revalidatePath("/projects");
  redirect("/projects");
}

export async function updateProject(id: string, formData: FormData) {
  const name = (formData.get("name") as string).trim();
  const description = (formData.get("description") as string).trim();
  const owner = (formData.get("owner") as string).trim();
  const model = (formData.get("model") as string).trim();
  const status = ((formData.get("status") as string | null) ?? "active").trim() || "active";
  const active_rubric = (formData.get("active_rubric") as string).trim();
  const judge_model = ((formData.get("judge_model") as string | null) ?? "").trim();
  const tags = ((formData.get("tags") as string | null) ?? "").trim();
  const notes = ((formData.get("notes") as string | null) ?? "").trim();

  const patch = { id, name, description, owner, model, status, active_rubric, judge_model, tags, notes };

  if (hasSupabase()) {
    if (!(await dbExistsProject(id))) throw new Error(`Project "${id}" not found`);
    await dbUpsertProject(patch);
  } else {
    const projects = readProjects() as Record<string, unknown>[];
    const idx = projects.findIndex((p) => p["id"] === id);
    if (idx === -1) throw new Error(`Project "${id}" not found`);
    projects[idx] = { ...projects[idx], ...patch };
    writeProjects(projects);
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  redirect(`/projects/${id}`);
}

export async function deleteProject(id: string) {
  if (hasSupabase()) {
    await dbDeleteProject(id);
  } else {
    const projects = readProjects() as Record<string, unknown>[];
    writeProjects(projects.filter((p) => p["id"] !== id));
  }

  revalidatePath("/projects");
  redirect("/projects");
}

export async function addModel(modelId: string, provider: string, label: string) {
  const id = modelId.trim().toLowerCase();
  if (!id) throw new Error("Model id required");
  const row = { id, provider: provider.trim() || "custom", label: label.trim() || id };

  if (hasSupabase()) {
    await dbUpsertModel(row);
  } else {
    const models = readModels();
    if (models.some((m) => m.id === id)) return; // already exists — no-op
    models.push(row);
    fs.writeFileSync(modelsPath, JSON.stringify(models, null, 2));
  }
  revalidatePath("/projects");
}
