"use client";

import { useState } from "react";
import { Braces, ChevronDown, ChevronRight } from "lucide-react";

export function JsonDebugPanel({ data, title = "JSON debug" }: { data: unknown; title?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-text-secondary hover:bg-bg-hover transition-colors"
      >
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        <Braces size={13} className="text-brand" /> {title}
      </button>
      {open && (
        <pre className="max-h-80 overflow-auto border-t border-border-subtle px-4 py-3 text-[11px] leading-relaxed font-mono text-text-secondary">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
