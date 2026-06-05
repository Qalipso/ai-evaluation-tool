import { Loader2, Inbox, AlertTriangle } from "lucide-react";

export function LoadingState({ label = "Running…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-card p-5 text-sm text-text-secondary">
      <Loader2 size={16} className="animate-spin text-brand" /> {label}
    </div>
  );
}

export function EmptyResultState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border-subtle bg-bg-card p-6 text-center">
      <Inbox size={18} className="mx-auto text-text-muted mb-2" />
      <div className="text-sm text-text-secondary">{title}</div>
      {hint && <div className="text-xs text-text-muted mt-1">{hint}</div>}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-bad/30 bg-bad/5 p-4 text-sm text-bad">
      <AlertTriangle size={15} className="mt-0.5 shrink-0" /> {message}
    </div>
  );
}
