import clsx from "clsx";
import { ReactNode } from "react";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "bg-bg-card border border-border-subtle rounded-lg",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "ok" | "warn" | "bad" | "brand";
}) {
  const valueColor =
    tone === "ok"
      ? "text-ok"
      : tone === "warn"
        ? "text-warn"
        : tone === "bad"
          ? "text-bad"
          : tone === "brand"
            ? "text-brand"
            : "text-text-primary";
  return (
    <Card className="p-4">
      <div className="text-[10px] uppercase tracking-wider text-text-muted">
        {label}
      </div>
      <div className={clsx("text-3xl font-semibold mt-1", valueColor)}>
        {value}
      </div>
      {sub && <div className="text-xs text-text-muted mt-1">{sub}</div>}
    </Card>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "ok" | "warn" | "bad" | "brand" | "neutral";
}) {
  const cls = {
    ok: "bg-ok/10 text-ok border-ok/30",
    warn: "bg-warn/10 text-warn border-warn/30",
    bad: "bg-bad/10 text-bad border-bad/30",
    brand: "bg-brand/10 text-brand border-brand/30",
    neutral: "bg-bg-hover text-text-secondary border-border-subtle",
  }[tone];
  return (
    <span
      className={clsx(
        "inline-flex items-center text-[10px] px-2 py-0.5 rounded-full border",
        cls,
      )}
    >
      {children}
    </span>
  );
}

export function Bar({
  value,
  max = 1,
  tone,
}: {
  value: number;
  max?: number;
  tone?: "ok" | "warn" | "bad";
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color =
    tone === "ok"
      ? "bg-ok"
      : tone === "warn"
        ? "bg-warn"
        : tone === "bad"
          ? "bg-bad"
          : "bg-brand";
  return (
    <div className="h-1.5 bg-bg-hover rounded-full overflow-hidden">
      <div className={clsx("h-full", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function scoreTone(score: number, threshold = 0.7): "ok" | "warn" | "bad" {
  if (score >= Math.max(threshold, 0.8)) return "ok";
  if (score >= threshold) return "warn";
  return "bad";
}
