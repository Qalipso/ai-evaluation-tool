import { NextResponse, type NextRequest } from "next/server";
import { authEnabled, verifySession, SESSION_COOKIE } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
}

// Public read, gated + rate-limited writes. Protects the cost/write surface —
// LLM API routes and Server Actions. Auth disabled when no access code.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isEvalApi = pathname.startsWith("/api/eval");
  const isAction = req.method === "POST" && req.headers.has("next-action");

  // Rate limit the LLM/cost surface regardless of auth.
  if (isEvalApi) {
    const rl = rateLimit(`eval:${clientIp(req)}`, 20, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many requests — slow down." },
        { status: 429, headers: { "retry-after": String(rl.retryAfter) } },
      );
    }
  }

  if (!authEnabled()) return NextResponse.next();
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
