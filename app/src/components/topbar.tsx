import Link from "next/link";
import { Search, Bell, Command } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { SettingsMenu } from "./SettingsMenu";
import { AccountMenu } from "./AccountMenu";

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border-subtle/70 bg-bg-base/70 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-6xl items-center gap-4 px-6">
        {/* Brand */}
        <Link href="/" className="group flex items-center gap-2.5 shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-hover text-[13px] font-bold text-white shadow-sm transition-transform group-hover:scale-105">
            AE
          </span>
          <span className="hidden sm:flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">AI Eval</span>
            <span className="text-[10px] text-text-muted -mt-0.5">quality + grounding lab</span>
          </span>
        </Link>

        {/* Search */}
        <div className="flex-1 flex justify-center">
          <div className="relative w-full max-w-md group">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-brand" />
            <input
              placeholder="Search rubrics, runs, cases…"
              className="w-full rounded-full border border-border-subtle bg-bg-card/80 pl-10 pr-12 py-2 text-sm text-text-primary placeholder:text-text-muted shadow-sm transition-all focus:outline-none focus:border-brand/60 focus:shadow-md focus:bg-bg-card"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden items-center gap-0.5 rounded-md border border-border-subtle bg-bg-base px-1.5 py-0.5 text-[10px] text-text-muted sm:flex">
              <Command size={9} /> K
            </kbd>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <ThemeToggle />
          <IconButton label="Notifications"><Bell size={16} /></IconButton>
          <SettingsMenu />
          <span className="mx-1 hidden h-6 w-px bg-border-subtle sm:block" />
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}

function IconButton({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <button
      title={label}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-text-secondary transition-colors hover:border-border-subtle hover:bg-bg-card hover:text-brand"
    >
      {children}
    </button>
  );
}
