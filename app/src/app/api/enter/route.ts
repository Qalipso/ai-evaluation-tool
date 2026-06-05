import { NextRequest, NextResponse } from "next/server";
import { checkAccessCode, createSession, SESSION_COOKIE, authEnabled } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    if (!authEnabled()) return NextResponse.json({ ok: true });
    const body = await req.json().catch(() => null);
    const code = (body?.code as string) ?? "";
    if (!checkAccessCode(code.trim())) {
      return NextResponse.json({ error: "Invalid access code." }, { status: 401 });
    }
    const token = await createSession();
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
    return res;
  } catch (e) {
    console.error("api/enter", e);
    return NextResponse.json({ error: "Could not sign in." }, { status: 500 });
  }
}
