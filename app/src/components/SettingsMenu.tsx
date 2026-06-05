"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Settings, Scale, BookOpen, Github, Compass } from "lucide-react";

export function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function restartTour() {
    try {
      localStorage.removeItem("eval_tour_v1");
    } catch {
      // ignore
    }
    setOpen(false);
    location.reload();
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Settings"
        aria-label="Settings"
        className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
          open ? "border-border-subtle bg-bg-card text-brand" : "border-transparent text-text-secondary hover:border-border-subtle hover:bg-bg-card hover:text-brand"
        }`}
      >
        <Settings size={16} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-60 rounded-xl border border-border-subtle bg-bg-card p-1.5 shadow-xl elev-card z-50">
          <div className="px-2.5 py-1.5 text-[10px] uppercase tracking-wide text-text-muted">Settings</div>
          <Item href="/evaluators" icon={<Scale size={14} />} label="Evaluators config" desc="Models, thresholds, checks" onClick={() => setOpen(false)} />
          <Item href="/wiki" icon={<BookOpen size={14} />} label="Wiki & guide" desc="How evaluation works" onClick={() => setOpen(false)} />
          <button onClick={restartTour} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-bg-hover transition-colors">
            <Compass size={14} className="text-text-muted" />
            <span className="flex-1">
              <span className="block">Replay tour</span>
              <span className="block text-[11px] text-text-muted">Show the tab guide again</span>
            </span>
          </button>
          <div className="my-1 h-px bg-border-subtle" />
          <a href="https://github.com/Qalipso/ai-evaluation-tool" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm hover:bg-bg-hover transition-colors" onClick={() => setOpen(false)}>
            <Github size={14} className="text-text-muted" /> View source
          </a>
        </div>
      )}
    </div>
  );
}

function Item({ href, icon, label, desc, onClick }: { href: string; icon: React.ReactNode; label: string; desc: string; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm hover:bg-bg-hover transition-colors">
      <span className="text-text-muted">{icon}</span>
      <span className="flex-1">
        <span className="block">{label}</span>
        <span className="block text-[11px] text-text-muted">{desc}</span>
      </span>
    </Link>
  );
}
