// Edge-safe signed-session for the demo gate. HMAC-SHA256 over a tiny payload.
// Used by middleware (Edge runtime) and the /api/enter route.

const COOKIE = "eval_session";
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const SESSION_COOKIE = COOKIE;

function secret(): string {
  return process.env.DEMO_SESSION_SECRET || "dev-insecure-secret-change-in-prod";
}

// Auth is opt-in: only enforced when a demo access code is configured.
export function authEnabled(): boolean {
  return Boolean(process.env.DEMO_ACCESS_CODE);
}

export function checkAccessCode(code: string): boolean {
  const expected = process.env.DEMO_ACCESS_CODE;
  if (!expected) return false;
  return code === expected;
}

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Uint8Array {
  const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
  return out;
}

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()) as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createSession(ttlMs = TTL_MS): Promise<string> {
  const payload = b64url(new TextEncoder().encode(JSON.stringify({ exp: Date.now() + ttlMs })));
  const sig = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(),
    new TextEncoder().encode(payload) as BufferSource,
  );
  return `${payload}.${b64url(new Uint8Array(sig))}`;
}

export async function verifySession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  try {
    const ok = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(),
      fromB64url(sig) as BufferSource,
      new TextEncoder().encode(payload) as BufferSource,
    );
    if (!ok) return false;
    const { exp } = JSON.parse(new TextDecoder().decode(fromB64url(payload)));
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}
