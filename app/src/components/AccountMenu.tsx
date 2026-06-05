"use client";

import { useEffect, useRef, useState } from "react";
import { Github, Globe, Sparkles } from "lucide-react";

export function AccountMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
        title="Account"
        aria-label="Account"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-hover text-[11px] font-semibold text-white ring-2 ring-bg-base transition-transform hover:scale-105"
      >
        EM
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl border border-border-subtle bg-bg-card p-1.5 shadow-xl elev-card z-50">
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-hover text-[11px] font-semibold text-white">EM</span>
            <span className="min-w-0">
              <span className="block text-sm font-medium">Demo session</span>
              <span className="block text-[11px] text-text-muted">Open access · no login</span>
            </span>
          </div>
          <div className="rounded-lg bg-bg-hover/60 px-2.5 py-2 mx-0.5 text-[11px] text-text-secondary leading-relaxed">
            <span className="inline-flex items-center gap-1 text-brand font-medium"><Sparkles size={11} /> Portfolio demo</span>
            <span className="block mt-0.5">This is a public showcase of the AI evaluation tool. Anyone with the link can explore it — no account needed.</span>
          </div>
          <div className="my-1 h-px bg-border-subtle" />
          <a href="https://github.com/Qalipso/ai-evaluation-tool" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm hover:bg-bg-hover transition-colors" onClick={() => setOpen(false)}>
            <Github size={14} className="text-text-muted" /> Source on GitHub
          </a>
          <a href="https://shatalov.dev" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm hover:bg-bg-hover transition-colors" onClick={() => setOpen(false)}>
            <Globe size={14} className="text-text-muted" /> Portfolio
          </a>
        </div>
      )}
    </div>
  );
}
