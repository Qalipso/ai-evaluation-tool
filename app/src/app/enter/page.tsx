"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, KeyRound } from "lucide-react";

export default function EnterPage() {
  return (
    <Suspense>
      <EnterForm />
    </Suspense>
  );
}

function EnterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/enter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (res.ok) router.push(next);
      else {
        setError(data.error ?? "Invalid code.");
        setLoading(false);
      }
    } catch {
      setError("Network error.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center py-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/15 text-brand mb-5">
        <Lock size={26} />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">Demo access</h1>
      <p className="text-text-secondary text-sm mt-2 max-w-sm leading-relaxed">
        Viewing is open. Running evaluations and editing data needs the demo code —
        this keeps LLM cost and writes safe on a public link.
      </p>

      <form onSubmit={submit} className="elev-card mt-7 w-full p-6 space-y-3">
        <div className="relative">
          <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            type="password"
            placeholder="Access code"
            autoFocus
            className="input pl-10 text-center tracking-widest"
          />
        </div>
        {error && <div className="rounded-xl bg-bad/10 border border-bad/25 px-4 py-2.5 text-sm text-bad">{error}</div>}
        <button type="submit" disabled={loading || !code.trim()} className="btn-pill btn-primary w-full py-3 text-sm font-semibold disabled:opacity-40">
          {loading ? "Unlocking…" : "Unlock demo"}
        </button>
      </form>
    </div>
  );
}
