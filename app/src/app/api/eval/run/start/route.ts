import { NextRequest, NextResponse } from "next/server";
import { createRun } from "@/lib/eval/run";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const project_id = (body?.project_id as string)?.trim();
    const rubric_id = (body?.rubric_id as string)?.trim();
    const model = typeof body?.model === "string" ? body.model : undefined;
    if (!project_id || !rubric_id) {
      return NextResponse.json({ error: "project_id and rubric_id are required" }, { status: 400 });
    }
    const res = await createRun({ project_id, rubric_id, model });
    return NextResponse.json(res);
  } catch (e) {
    console.error("run/start", e);
    return NextResponse.json({ error: "Could not start run." }, { status: 500 });
  }
}
