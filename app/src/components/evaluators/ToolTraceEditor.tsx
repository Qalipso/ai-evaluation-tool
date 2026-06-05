"use client";

import { useState } from "react";
import type { ToolTraceLite } from "@/lib/evaluators/types";
import { EMPTY_TRACE } from "@/lib/evaluators/types";

// Hand-editable tool trace. Edit the booleans directly, or paste JSON.
export function ToolTraceEditor({ value, onChange }: { value: ToolTraceLite; onChange: (t: ToolTraceLite) => void }) {
  const [raw, setRaw] = useState<string>(JSON.stringify(value, null, 2));
  const [err, setErr] = useState<string | null>(null);

  const keys = Object.keys(EMPTY_TRACE) as (keyof ToolTraceLite)[];

  function toggle(k: keyof ToolTraceLite) {
    const next = { ...value, [k]: !value[k] };
    onChange(next);
    setRaw(JSON.stringify(next, null, 2));
    setErr(null);
  }

  function applyRaw(text: string) {
    setRaw(text);
    try {
      const parsed = JSON.parse(text);
      const next: ToolTraceLite = { ...EMPTY_TRACE };
      for (const k of keys) next[k] = Boolean(parsed[k]);
      onChange(next);
      setErr(null);
    } catch {
      setErr("Invalid JSON");
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => toggle(k)}
            className={`text-[11px] font-mono px-2.5 py-1 rounded-full border transition-colors ${
              value[k]
                ? "border-brand/40 bg-brand/10 text-brand"
                : "border-border-subtle bg-bg-card text-text-muted hover:text-text-secondary"
            }`}
          >
            {k} {value[k] ? "✓" : "✗"}
          </button>
        ))}
      </div>
      <textarea
        value={raw}
        onChange={(e) => applyRaw(e.target.value)}
        rows={5}
        spellCheck={false}
        className="input font-mono text-[11px]"
      />
      {err && <div className="text-[11px] text-bad">{err}</div>}
    </div>
  );
}
