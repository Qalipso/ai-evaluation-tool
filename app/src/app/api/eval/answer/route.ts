import { NextRequest, NextResponse } from "next/server";
import { generateAnswer } from "@/lib/eval/generate";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const question = (body?.question as string)?.trim();
    const masterPrompt = (body?.master_prompt as string) ?? "";
    const context: string[] = Array.isArray(body?.context) ? body.context : [];
    const model = typeof body?.model === "string" ? body.model : undefined;

    if (!question) {
      return NextResponse.json({ error: "question is required" }, { status: 400 });
    }

    const { answer, cost_usd } = await generateAnswer({ masterPrompt, question, context, model });
    return NextResponse.json({ answer, cost_usd });
  } catch (e) {
    console.error("api/eval/answer", e);
    const msg = e instanceof Error && /budget|OPENAI_API_KEY/i.test(e.message) ? e.message : "Could not generate answer.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
