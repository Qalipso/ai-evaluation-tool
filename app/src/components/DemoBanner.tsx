export function DemoBanner() {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 text-sm text-amber-800 flex items-center gap-2">
      <span className="font-semibold">Demo:</span>
      <span>
        <code className="font-mono text-xs">/runs/new</code> runs a real
        multi-dimension LLM-judge + deterministic engine and persists to Supabase
        (needs <code className="font-mono text-xs">SUPABASE_*</code> +{" "}
        <code className="font-mono text-xs">OPENAI_API_KEY</code>). Seeded
        projects/runs are pre-scored sample data.
      </span>
      <a
        href="https://github.com/Qalipso"
        target="_blank"
        rel="noopener noreferrer"
        className="ml-auto underline underline-offset-2 shrink-0"
      >
        Source →
      </a>
    </div>
  );
}
