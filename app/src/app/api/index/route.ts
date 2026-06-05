import { NextResponse } from "next/server";
import { fetchProjects, fetchRubrics, fetchRuns, fetchCases } from "@/lib/db";

// Lightweight search index for the command palette.
export async function GET() {
  try {
    const [projects, rubrics, runs, cases] = await Promise.all([
      fetchProjects(),
      fetchRubrics(),
      fetchRuns(),
      fetchCases(),
    ]);
    return NextResponse.json({
      projects: projects.map((p) => ({ id: p.id, name: p.name })),
      rubrics: rubrics.map((r) => ({ id: r.id, name: r.name, version: r.version })),
      runs: runs.slice(0, 50).map((r) => ({ id: r.id, project_id: r.project_id, verdict: r.verdict, score: r.overall_score })),
      cases: cases.slice(0, 200).map((c) => ({ id: c.id, run_id: c.run_id, input: c.input.slice(0, 80) })),
    });
  } catch (e) {
    console.error("api/index", e);
    return NextResponse.json({ error: "index failed" }, { status: 500 });
  }
}
