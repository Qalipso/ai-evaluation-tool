import { NextResponse, type NextRequest } from "next/server";
import { authEnabled, verifySession, SESSION_COOKIE } from "@/lib/auth";

// Public read, gated writes. Protects the cost/write surface — LLM API routes
// and Server Actions — behind the demo session. Disabled when no access code.
export async function middleware(req: NextRequest) {
  if (!authEnabled()) return NextResponse.next();

  const { pathname } = req.nextUrl;
  const isEvalApi = pathname.startsWith("/api/eval");
  const isAction = req.method === "POST" && req.headers.has("next-action");
  if (!isEvalApi && !isAction) return NextResponse.next();

  const ok = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (ok) return NextResponse.next();

  return NextResponse.json(
    { error: "Demo access required — enter the access code at /enter." },
    { status: 401 },
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|enter|api/enter).*)"],
};
