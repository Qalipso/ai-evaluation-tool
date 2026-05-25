export function DemoBanner() {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 text-sm text-amber-800 flex items-center gap-2">
      <span className="font-semibold">Demo mode:</span>
      <span>
        1 rubric runs a real LLM call (Helpfulness). All other routes use mock
        data. No production eval engine.
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
