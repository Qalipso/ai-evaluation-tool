"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

const KEY = "eval_banner_dismissed_v1";

export function DemoBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      // ignore
    }
  }, []);

  function close() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // ignore
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="flex items-center gap-2 border-b border-border-subtle bg-brand/5 px-6 py-1.5 text-xs text-text-secondary">
      <span className="font-medium text-brand">Live demo</span>
      <span className="hidden sm:inline">
        Real LLM-judge + claim pipeline, persisted to Supabase. Score your own output on{" "}
        <code className="font-mono">/runs/new</code>.
      </span>
      <a
        href="https://github.com/Qalipso/ai-evaluation-tool"
        target="_blank"
        rel="noopener noreferrer"
        className="ml-auto underline underline-offset-2 hover:text-brand transition-colors shrink-0"
      >
        Source
      </a>
      <button onClick={close} aria-label="Dismiss" className="shrink-0 text-text-muted hover:text-text-primary transition-colors">
        <X size={14} />
      </button>
    </div>
  );
}
