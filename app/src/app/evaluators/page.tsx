import { hasSupabase } from "@/lib/supabase";
import { EvaluatorPlayground } from "@/components/evaluators/EvaluatorPlayground";

export default function EvaluatorsPage() {
  const llm = Boolean(process.env.OPENAI_API_KEY);
  const supabase = hasSupabase();

  return (
    <div className="mx-auto w-full max-w-5xl py-6">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Evaluator playground</h1>
        <p className="text-text-secondary text-sm mt-2 max-w-xl mx-auto leading-relaxed">
          Run the claim pipeline and deterministic checks on any agent output and watch
          exactly what the engine flags — extracted claims, evidence verification, and
          pass/fail rules with severity and rationale.
        </p>
      </header>

      <EvaluatorPlayground llm={llm} supabase={supabase} />
    </div>
  );
}
