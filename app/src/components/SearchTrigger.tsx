"use client";

import { Search, Command } from "lucide-react";

export function SearchTrigger() {
  function open() {
    window.dispatchEvent(new CustomEvent("open-command"));
  }
  return (
    <button
      onClick={open}
      className="relative w-full max-w-md group flex items-center rounded-full border border-border-subtle bg-bg-card/80 pl-10 pr-12 py-2 text-sm text-text-muted shadow-sm transition-all hover:border-brand/50 hover:bg-bg-card"
    >
      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
      <span>Search rubrics, runs, cases…</span>
      <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden items-center gap-0.5 rounded-md border border-border-subtle bg-bg-base px-1.5 py-0.5 text-[10px] text-text-muted sm:flex">
        <Command size={9} /> K
      </kbd>
    </button>
  );
}
