"use server";
import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const rubricsPath = path.join(process.cwd(), "..", "mock-data", "rubrics.json");

type Dimension = { id: string; name: string; method: string; weight: number; threshold: number };
type RubricData = { id: string; name: string; version: string; owner: string; project_id: string; updated: string; dimensions: Dimension[]; safety_gates: string[] };

function readRubrics(): RubricData[] {
  const raw = fs.readFileSync(rubricsPath, "utf-8").trim();
  return raw ? JSON.parse(raw) : [];
}

function writeRubrics(data: RubricData[]) {
  fs.writeFileSync(rubricsPath, JSON.stringify(data, null, 2));
}

function parseDimensions(formData: FormData): Dimension[] {
  const dims: Dimension[] = [];
  let i = 0;
  while (formData.has(`dim_id_${i}`)) {
    dims.push({
      id: (formData.get(`dim_id_${i}`) as string).trim().toLowerCase().replace(/\s+/g, "_"),
      name: (formData.get(`dim_name_${i}`) as string).trim(),
      method: (formData.get(`dim_method_${i}`) as string).trim(),
      weight: parseFloat(formData.get(`dim_weight_${i}`) as string) || 0,
      threshold: parseInt(formData.get(`dim_threshold_${i}`) as string) || 0,
    });
    i++;
  }
  return dims;
}

function parseSafetyGates(raw: string): string[] {
  return raw.split(",").map((s) => s.trim().toLowerCase().replace(/\s+/g, "_")).filter(Boolean);
}

export async function createRubric(formData: FormData) {
  const id = (formData.get("id") as string).trim().toLowerCase().replace(/\s+/g, "-");
  const name = (formData.get("name") as string).trim();
  const version = (formData.get("version") as string).trim();
  const owner = (formData.get("owner") as string).trim();
  const project_id = (formData.get("project_id") as string).trim();
  const dimensions = parseDimensions(formData);
  const safety_gates = parseSafetyGates(formData.get("safety_gates") as string ?? "");
  const updated = new Date().toISOString().split("T")[0];

  if (!id || !name) throw new Error("id and name are required");

  const rubrics = readRubrics();
  if (rubrics.some((r) => r.id === id)) throw new Error(`Rubric id "${id}" already exists`);

  rubrics.push({ id, name, version, owner, project_id, updated, dimensions, safety_gates });
  writeRubrics(rubrics);

  revalidatePath("/rubrics");
  redirect("/rubrics");
}

export async function updateRubric(id: string, formData: FormData) {
  const name = (formData.get("name") as string).trim();
  const version = (formData.get("version") as string).trim();
  const owner = (formData.get("owner") as string).trim();
  const project_id = (formData.get("project_id") as string).trim();
  const dimensions = parseDimensions(formData);
  const safety_gates = parseSafetyGates(formData.get("safety_gates") as string ?? "");
  const updated = new Date().toISOString().split("T")[0];

  const rubrics = readRubrics();
  const idx = rubrics.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error(`Rubric "${id}" not found`);

  rubrics[idx] = { ...rubrics[idx], name, version, owner, project_id, updated, dimensions, safety_gates };
  writeRubrics(rubrics);

  revalidatePath("/rubrics");
  revalidatePath(`/rubrics/${id}`);
  redirect(`/rubrics/${id}`);
}

export async function deleteRubric(id: string) {
  const rubrics = readRubrics();
  writeRubrics(rubrics.filter((r) => r.id !== id));

  revalidatePath("/rubrics");
  redirect("/rubrics");
}
