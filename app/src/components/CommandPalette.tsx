"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, LayoutDashboard, Activity, Scale, Users, FileText, FolderKanban, ClipboardList, CornerDownLeft } from "lucide-react";

type Index = {
  projects: { id: string; name: string }[];
  rubrics: { id: string; name: string; version: string }[];
  runs: { id: string; project_id: string; verdict: string; score: number }[];
  cases: { id: string; run_id: string; input: string }[];
};

type Item = { label: string; sub?: string; href: string; kind: string };

const NAV: Item[] = [
  { label: "Dashboard", href: "/", kind: "nav" },
  { label: "New evaluation run", href: "/runs/new", kind: "nav" },
  { label: "Evaluators", href: "/evaluators", kind: "nav" },
  { label: "Human Review", href: "/review", kind: "nav" },
  { label: "Reports", href: "/reports", kind: "nav" },
  { label: "Regression", href: "/compare", kind: "nav" },
  { label: "Projects", href: "/projects", kind: "nav" },
  { label: "Rubrics", href: "/rubrics", kind: "nav" },
  { label: "Wiki", href: "/wiki", kind: "nav" },
];

const KIND_ICON: Record<string, React.ReactNode> = {
  nav: <LayoutDashboard size={14} />,
  run: <Activity size={14} />,
  evaluator: <Scale size={14} />,
  review: <Users size={14} />,
  report: <FileText size={14} />,
  project: <FolderKanban size={14} />,
  rubric: <ClipboardList size={14} />,
  case: <FileText size={14} />,
};

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [index, setIndex] = useState<Index | null>(null);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-command", onOpen as EventListener);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command", onOpen as EventListener);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
      if (!index) {
        fetch("/api/index")
          .then((r) => r.json())
          .then((d) => setIndex(d))
          .catch(() => {});
    }
    }
  }, [open, index]);

  const items: Item[] = useMemo(() => {
    const all: Item[] = [...NAV];
    if (index) {
      for (const p of index.projects) all.push({ label: p.name, sub: p.id, href: `/projects/${p.id}`, kind: "project" });
      for (const r of index.rubrics) all.push({ label: `${r.name} · v${r.version}`, sub: r.id, href: `/rubrics/${r.id}`, kind: "rubric" });
      for (const r of index.runs) all.push({ label: `Run ${r.id}`, sub: `${r.verdict} · ${r.score.toFixed(2)}`, href: `/runs/${r.id}`, kind: "run" });
      for (const c of index.cases) all.push({ label: c.input || c.id, sub: c.id, href: `/cases/${c.id}`, kind: "case" });
    }
    const query = q.trim().toLowerCase();
    if (!query) return all.slice(0, 12);
    return all
      .filter((i) => `${i.label} ${i.sub ?? ""}`.toLowerCase().includes(query))
      .slice(0, 20);
  }, [q, index]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[14vh]" onClick={() => setOpen(false)}>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-[1px]" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-2xl elev-card overflow-hidden"
      >
        <div className="flex items-center gap-2.5 border-b border-border-subtle px-4">
          <Search size={16} className="text-text-muted shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setActive(0); }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, items.length - 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
              if (e.key === "Enter" && items[active]) go(items[active].href);
            }}
            placeholder="Search or jump to…"
            className="flex-1 bg-transparent py-3.5 text-sm focus:outline-none placeholder:text-text-muted"
          />
          <kbd className="text-[10px] text-text-muted border border-border-subtle rounded px-1.5 py-0.5">esc</kbd>
        </div>
        <div className="max-h-80 overflow-auto p-1.5">
          {items.length === 0 && <div className="px-3 py-6 text-center text-sm text-text-muted">No matches.</div>}
          {items.map((it, i) => (
            <button
              key={it.href + i}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(it.href)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${i === active ? "bg-brand/10" : "hover:bg-bg-hover"}`}
            >
              <span className="text-text-muted shrink-0">{KIND_ICON[it.kind] ?? <Search size={14} />}</span>
              <span className="flex-1 min-w-0">
                <span className="block truncate">{it.label}</span>
                {it.sub && <span className="block truncate text-[11px] text-text-muted">{it.sub}</span>}
              </span>
              {i === active && <CornerDownLeft size={13} className="text-text-muted shrink-0" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
