import { Search, Bell, Settings } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export function Topbar() {
  return (
    <header className="border-b border-border-subtle bg-bg-panel/70 backdrop-blur px-4 h-12 flex items-center gap-3">
      <div className="flex items-center gap-2 flex-1 max-w-2xl">
        <div className="relative w-full">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            placeholder="Search rubrics, runs, cases, projects…"
            className="w-full pl-8 pr-3 py-1.5 bg-bg-card border border-border-subtle rounded-md text-sm placeholder:text-text-muted focus:outline-none focus:border-brand"
          />
        </div>
      </div>
      <ThemeToggle />
      <button className="p-1.5 rounded-md hover:bg-bg-hover text-text-secondary">
        <Bell size={15} />
      </button>
      <button className="p-1.5 rounded-md hover:bg-bg-hover text-text-secondary">
        <Settings size={15} />
      </button>
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand to-brand-subtle flex items-center justify-center text-[11px] font-semibold text-white">
        EM
      </div>
    </header>
  );
}
