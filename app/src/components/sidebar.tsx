"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  BookOpen,
  FolderKanban,
  ClipboardList,
  Activity,
  GitCompare,
  Users,
  FileText,
  ShieldAlert,
  Gamepad2,
} from "lucide-react";

const navCore = [
  { href: "/", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/projects", label: "Projects", Icon: FolderKanban },
  { href: "/rubrics", label: "Rubrics", Icon: ClipboardList },
  { href: "/runs", label: "Eval Runs", Icon: Activity },
  { href: "/compare", label: "Regression", Icon: GitCompare },
  { href: "/review", label: "Human Review", Icon: Users },
  { href: "/reports", label: "Reports", Icon: FileText },
];

const navAdvanced = [
  { href: "/wiki", label: "Wiki", Icon: BookOpen, badge: "guide" },
  { href: "/play", label: "Play", Icon: Gamepad2, badge: "new" },
  { href: "/safety", label: "Safety Log", Icon: ShieldAlert, badge: "live" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 border-r border-border-subtle bg-bg-panel flex flex-col">
      <div className="px-4 py-5 border-b border-border-subtle flex items-center gap-2">
        <div className="w-8 h-8 rounded-md bg-gradient-to-br from-brand to-brand-subtle flex items-center justify-center text-sm font-bold">
          AE
        </div>
        <div>
          <div className="text-sm font-semibold">AI Eval</div>
          <div className="text-[11px] text-text-muted">quality + grounding lab</div>
        </div>
      </div>

      <nav className="px-2 py-3 flex-1 overflow-y-auto text-sm">
        <div className="px-2 pt-2 pb-1 text-[10px] uppercase tracking-wider text-text-muted">Core</div>
        {navCore.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-2 px-2 py-1.5 rounded-md",
                active
                  ? "bg-brand/10 text-brand font-medium"
                  : "text-text-secondary hover:bg-bg-hover hover:text-text-primary",
              )}
            >
              <Icon size={15} />
              <span>{label}</span>
            </Link>
          );
        })}

        <div className="px-2 pt-4 pb-1 text-[10px] uppercase tracking-wider text-text-muted">Advanced</div>
        {navAdvanced.map(({ href, label, Icon, badge }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center justify-between gap-2 px-2 py-1.5 rounded-md",
                active
                  ? "bg-brand/10 text-brand font-medium"
                  : "text-text-secondary hover:bg-bg-hover hover:text-text-primary",
              )}
            >
              <span className="flex items-center gap-2">
                <Icon size={15} />
                <span>{label}</span>
              </span>
              {badge && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-subtle text-text-primary uppercase tracking-wide">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-border-subtle text-[11px] text-text-muted leading-snug">
        v0.1.0 · mock data<br />
        Read-only portfolio build
      </div>
    </aside>
  );
}
