import { NextRequest, NextResponse } from "next/server";
import { runClaimPipeline } from "@/lib/eval/claims";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const ai_output = (body?.ai_output as string)?.trim();
    const context: string[] = Array.isArray(body?.context) ? body.context : [];
    const model = typeof body?.model === "string" ? body.model : undefined;
    if (!ai_output) return NextResponse.json({ error: "ai_output is required" }, { status: 400 });
    if (ai_output.length > 4000) return NextResponse.json({ error: "ai_output too long (max 4000)" }, { status: 400 });

    const res = await runClaimPipeline(
      { input: "", expected_behavior: "", ai_output, retrieved_context: context },
      model,
    );
    return NextResponse.json(res);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}
