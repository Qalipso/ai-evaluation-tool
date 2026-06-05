import { NextRequest, NextResponse } from "next/server";
import { evaluateCaseIntoRun } from "@/lib/eval/run";

const MAX_OUTPUT = 8000;

export async function POST(req: NextRequest) {
  try {
    const b = await req.json().catch(() => null);
    const run_id = (b?.run_id as string)?.trim();
    const rubric_id = (b?.rubric_id as string)?.trim();
    const ai_output = (b?.ai_output as string) ?? "";
    if (!run_id || !rubric_id) {
      return NextResponse.json({ error: "run_id and rubric_id are required" }, { status: 400 });
    }
    if (!ai_output.trim()) return NextResponse.json({ error: "ai_output is required" }, { status: 400 });
    if (ai_output.length > MAX_OUTPUT) {
      return NextResponse.json({ error: `ai_output must be ${MAX_OUTPUT} chars or fewer` }, { status: 400 });
    }

    const res = await evaluateCaseIntoRun({
      run_id,
      rubric_id,
      index: Number(b?.index) || 0,
      input: (b?.input as string) ?? "",
      expected_behavior: (b?.expected_behavior as string) ?? "",
      ai_output,
      retrieved_context: Array.isArray(b?.retrieved_context) ? b.retrieved_context : [],
      model: typeof b?.model === "string" ? b.model : undefined,
    });
    return NextResponse.json(res);
  } catch (e) {
    console.error("run/case", e);
    const msg = e instanceof Error && /budget/i.test(e.message) ? e.message : "Could not evaluate case.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
