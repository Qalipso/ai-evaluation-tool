// Seed Supabase from mock-data/*.json — one-off, idempotent (upserts).
// Usage (from app/):  node scripts/seed.mjs
// Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local or the environment.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appDir = join(__dirname, "..");
const dataDir = join(appDir, "mock-data");

// Minimal .env.local loader (avoids a dotenv dependency).
function loadEnvLocal() {
  try {
    const raw = readFileSync(join(appDir, ".env.local"), "utf-8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // no .env.local — rely on process env
  }
}
loadEnvLocal();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const read = (name) => JSON.parse(readFileSync(join(dataDir, `${name}.json`), "utf-8"));

async function upsert(table, rows, opts) {
  if (!rows.length) return;
  const { error } = await db.from(table).upsert(rows, opts);
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`  ${table}: ${rows.length}`);
}

async function main() {
  const models = read("models");
  const projects = read("projects");
  const rubrics = read("rubrics");
  const runs = read("runs");
  const cases = read("cases");

  console.log("Seeding Supabase…");

  // Parents first (FK order).
  await upsert("models", models, { onConflict: "id" });

  await upsert(
    "projects",
    projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description ?? "",
      owner: p.owner ?? "",
      model: p.model ?? "",
      active_rubric: p.active_rubric ?? "",
      cases_total: p.cases_total ?? 0,
      status: p.status ?? "active",
      judge_model: p.judge_model ?? "",
      tags: p.tags ?? "",
      notes: p.notes ?? "",
    })),
    { onConflict: "id" },
  );

  await upsert(
    "rubrics",
    rubrics.map((r) => ({
      id: r.id,
      name: r.name,
      version: r.version ?? "1.0",
      owner: r.owner ?? "",
      project_id: r.project_id ?? null,
      updated: r.updated ?? "",
      safety_gates: r.safety_gates ?? [],
    })),
    { onConflict: "id" },
  );

  // Dimensions: replace per rubric, then insert with order.
  for (const r of rubrics) {
    await db.from("dimensions").delete().eq("rubric_id", r.id);
    const dims = (r.dimensions ?? []).map((d, i) => ({
      rubric_id: r.id,
      dim_key: d.id,
      name: d.name,
      method: d.method,
      weight: d.weight,
      threshold: d.threshold,
      ord: i,
    }));
    await upsert("dimensions", dims);
  }

  await upsert(
    "runs",
    runs.map((r) => ({
      id: r.id,
      project_id: r.project_id ?? null,
      rubric_id: r.rubric_id ?? null,
      model: r.model ?? "",
      dataset_id: r.dataset_id ?? "",
      started_at: r.started_at,
      cases_total: r.cases_total ?? 0,
      cases_passing: r.cases_passing ?? 0,
      overall_score: r.overall_score ?? 0,
      verdict: r.verdict ?? "needs_work",
      regression_flag: r.regression_flag ?? false,
      safety_findings: r.safety_findings ?? 0,
      variable_changed: r.variable_changed ?? "",
    })),
    { onConflict: "id" },
  );

  // Cases + children.
  await upsert(
    "cases",
    cases.map((c) => ({
      id: c.id,
      run_id: c.run_id,
      input: c.input ?? "",
      expected_behavior: c.expected_behavior ?? "",
      ai_output: c.ai_output ?? "",
      retrieved_context: c.retrieved_context ?? [],
      overall_score: c.overall_score ?? 0,
      human_review: c.human_review ?? null,
    })),
    { onConflict: "id" },
  );

  for (const c of cases) {
    await db.from("scores").delete().eq("case_id", c.id);
    await db.from("claims").delete().eq("case_id", c.id);
    await db.from("safety_findings").delete().eq("case_id", c.id);

    await upsert(
      "scores",
      (c.scores ?? []).map((s, i) => ({
        case_id: c.id,
        dim_id: s.dim_id,
        score: s.score,
        method: s.method,
        rationale: s.rationale ?? "",
        threshold_passed: s.threshold_passed ?? false,
        ord: i,
      })),
    );
    await upsert(
      "claims",
      (c.claims ?? []).map((cl, i) => ({
        case_id: c.id,
        text: cl.text,
        label: cl.label,
        confidence: cl.confidence ?? 0,
        source_idx: cl.source_idx ?? null,
        evidence: cl.evidence ?? "",
        ord: i,
      })),
    );
    await upsert(
      "safety_findings",
      (c.safety_findings ?? []).map((f, i) => ({
        case_id: c.id,
        category: f.category,
        severity: f.severity,
        evidence: f.evidence ?? "",
        status: f.status ?? "open",
        ord: i,
      })),
    );
  }

  console.log("Seed complete.");
}

main().catch((e) => {
  console.error("Seed failed:", e.message);
  process.exit(1);
});
