import { NextRequest, NextResponse } from "next/server";
import { fetchRubric } from "@/lib/db";
import { generateQuestions } from "@/lib/eval/generate";
import { isAllowedModel } from "@/lib/modelWhitelist";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const rubric_id = body?.rubric_id as string | undefined;
    const masterPrompt = (body?.master_prompt as string) ?? "";
    const context: string[] = Array.isArray(body?.context) ? body.context : [];
    const count = Math.min(Math.max(Number(body?.count) || 6, 1), 12);
    const model = typeof body?.model === "string" ? body.model : undefined;
    if (!isAllowedModel(model)) return NextResponse.json({ error: "Model not allowed" }, { status: 400 });

    if (!rubric_id) {
      return NextResponse.json({ error: "rubric_id is required" }, { status: 400 });
    }
    const rubric = await fetchRubric(rubric_id);
    if (!rubric) return NextResponse.json({ error: "Rubric not found" }, { status: 404 });

    const { questions, cost_usd } = await generateQuestions({
      rubricName: rubric.name,
      dims: rubric.dimensions.map((d) => ({ id: d.id, name: d.name })),
      masterPrompt,
      context,
      count,
      model,
    });

    return NextResponse.json({ questions, cost_usd });
  } catch (e) {
    console.error("api/eval/questions", e);
    const msg = e instanceof Error && /budget|OPENAI_API_KEY/i.test(e.message) ? e.message : "Could not generate questions.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
