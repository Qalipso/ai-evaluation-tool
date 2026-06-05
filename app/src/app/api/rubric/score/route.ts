import { NextRequest, NextResponse } from "next/server";
import { scoreHelpfulness } from "@/lib/llm";

// In-memory daily cost cap — resets when the process restarts.
// Good enough for a demo; replace with DB persistence in production.
const DAILY_CAP_USD = 5;
let dailySpend = 0;
let capResetDay = new Date().toDateString();

function checkAndResetCap(): void {
  const today = new Date().toDateString();
  if (today !== capResetDay) {
    dailySpend = 0;
    capResetDay = today;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.text !== "string") {
      return NextResponse.json(
        { error: "Request body must include { text: string }" },
        { status: 400 }
      );
    }

    const text = body.text.trim();

    if (!text) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }
    if (text.length > 2000) {
      return NextResponse.json(
        { error: "text must be 2000 characters or fewer" },
        { status: 400 }
      );
    }

    checkAndResetCap();
    if (dailySpend >= DAILY_CAP_USD) {
      return NextResponse.json(
        { error: `Daily LLM budget ($${DAILY_CAP_USD}) reached. Try again tomorrow.` },
        { status: 429 }
      );
    }

    const result = await scoreHelpfulness(text);
    dailySpend += result.cost_usd;

    return NextResponse.json({
      score: result.score,
      rationale: result.rationale,
      model: result.model,
      cost_usd: result.cost_usd,
      daily_spend_usd: dailySpend,
    });
  } catch (err) {
    console.error("api/rubric/score", err);
    const message = err instanceof Error && /budget|OPENAI_API_KEY/i.test(err.message) ? err.message : "Could not score output.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
