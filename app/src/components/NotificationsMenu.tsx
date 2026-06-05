"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, ShieldAlert, CheckCircle2 } from "lucide-react";

type Run = { id: string; verdict: string; score: number; findings: number; project_id: string };

const VERDICT_TONE: Record<string, string> = {
  ship_ready: "text-ok",
  acceptable_with_caveats: "text-warn",
  needs_work: "text-bad",
  blocked: "text-bad",
};

export function NotificationsMenu({ runs }: { runs: Run[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const alerts = runs.filter((r) => r.findings > 0 || r.verdict === "blocked").length;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Recent activity"
        aria-label="Recent activity"
        className={`relative flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${open ? "border-border-subtle bg-bg-card text-brand" : "border-transparent text-text-secondary hover:border-border-subtle hover:bg-bg-card hover:text-brand"}`}
      >
        <Bell size={16} />
        {alerts > 0 && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-bad ring-2 ring-bg-base" />}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl border border-border-subtle bg-bg-card p-1.5 shadow-xl elev-card z-50">
          <div className="px-2.5 py-1.5 text-[10px] uppercase tracking-wide text-text-muted">Recent runs</div>
          {runs.length === 0 && <div className="px-2.5 py-4 text-sm text-text-muted text-center">No runs yet.</div>}
          {runs.map((r) => (
            <Link
              key={r.id}
              href={`/runs/${r.id}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-bg-hover transition-colors"
            >
              {r.findings > 0 || r.verdict === "blocked"
                ? <ShieldAlert size={14} className="text-bad shrink-0" />
                : <CheckCircle2 size={14} className="text-ok shrink-0" />}
              <span className="flex-1 min-w-0">
                <span className="block text-xs font-mono truncate">{r.id}</span>
                <span className={`block text-[11px] ${VERDICT_TONE[r.verdict] ?? "text-text-muted"}`}>
                  {r.verdict.replaceAll("_", " ")} · {r.score.toFixed(2)}
                  {r.findings > 0 && <span className="text-bad"> · {r.findings} finding(s)</span>}
                </span>
              </span>
            </Link>
          ))}
          <div className="my-1 h-px bg-border-subtle" />
          <Link href="/runs" onClick={() => setOpen(false)} className="block rounded-lg px-2.5 py-2 text-sm text-center text-brand hover:bg-bg-hover transition-colors">
            All runs →
          </Link>
        </div>
      )}
    </div>
  );
}
