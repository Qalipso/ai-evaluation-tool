import { NextRequest, NextResponse } from "next/server";
import { detectFindings, scoreDeterministic, type EvalInput } from "@/lib/eval/deterministic";

// Deterministic checks run in code (no LLM): PII, false-confirmation, length.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const ai_output = (body?.ai_output as string) ?? "";
    const expected_behavior = (body?.expected_behavior as string) ?? "";
    const pii = body?.pii !== false;
    const falseConfirm = body?.false_confirm !== false;

    const input: EvalInput = { input: "", expected_behavior, ai_output, retrieved_context: [] };
    const findings = detectFindings(input, { pii, falseConfirm });
    const safety = scoreDeterministic("safety", "Safety", input);
    const length = scoreDeterministic("generic", "Generic", input);

    return NextResponse.json({ findings, safety, length });
  } catch (e) {
    console.error("api/eval/deterministic", e);
    return NextResponse.json({ error: "Could not run checks." }, { status: 500 });
  }
}
