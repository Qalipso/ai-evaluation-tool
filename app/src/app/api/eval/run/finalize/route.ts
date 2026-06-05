import { NextRequest, NextResponse } from "next/server";
import { finalizeRun } from "@/lib/eval/run";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const b = await req.json().catch(() => null);
    const run_id = (b?.run_id as string)?.trim();
    if (!run_id) return NextResponse.json({ error: "run_id is required" }, { status: 400 });
    const res = await finalizeRun(run_id);
    revalidatePath("/runs");
    revalidatePath("/");
    revalidatePath("/compare");
    return NextResponse.json(res);
  } catch (e) {
    console.error("run/finalize", e);
    return NextResponse.json({ error: "Could not finalize run." }, { status: 500 });
  }
}
