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
  Scale,
  Database,
  type LucideIcon,
} from "lucide-react";

type DockItem = { href: string; label: string; Icon: LucideIcon; badge?: string };

const items: DockItem[] = [
  { href: "/", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/projects", label: "Projects", Icon: FolderKanban },
  { href: "/rubrics", label: "Rubrics", Icon: ClipboardList },
  { href: "/runs", label: "Eval Runs", Icon: Activity },
  { href: "/datasets", label: "Datasets", Icon: Database },
  { href: "/evaluators", label: "Evaluators", Icon: Scale },
  { href: "/compare", label: "Regression", Icon: GitCompare },
  { href: "/review", label: "Human Review", Icon: Users },
  { href: "/reports", label: "Reports", Icon: FileText },
  { href: "/wiki", label: "Wiki", Icon: BookOpen, badge: "guide" },
  { href: "/play", label: "Play", Icon: Gamepad2, badge: "new" },
  { href: "/safety", label: "Safety Log", Icon: ShieldAlert, badge: "live" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

// macOS-style floating dock, centered at the bottom.
export function Dock() {
  const pathname = usePathname();

  return (
    <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center pointer-events-none">
      <nav className="pointer-events-auto flex items-end gap-1.5 rounded-2xl elev-card px-2.5 py-2">
        <Link
          href="/"
          className="mr-1 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-hover text-[13px] font-bold text-bg-card shadow-sm"
          title="AI Eval"
        >
          AE
        </Link>
        <span className="mr-1 self-stretch w-px bg-border-subtle" />
        {items.map(({ href, label, Icon, badge }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={clsx(
                "group relative flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-150 hover:-translate-y-1.5",
                active
                  ? "bg-brand/15 text-brand"
                  : "text-text-secondary hover:bg-bg-hover hover:text-text-primary",
              )}
            >
              <Icon size={19} />
              {badge && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-brand ring-2 ring-bg-card" />
              )}
              {active && <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-brand" />}
              <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-text-primary px-2 py-1 text-[11px] font-medium text-bg-card opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
