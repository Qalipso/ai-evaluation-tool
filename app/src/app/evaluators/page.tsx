import { hasSupabase } from "@/lib/supabase";
import { fetchModels, getSettings } from "@/lib/db";
import { EvaluatorConfig } from "@/components/evaluators/EvaluatorConfig";
import { EvaluatorPlayground } from "@/components/evaluators/EvaluatorPlayground";

export default async function EvaluatorsPage() {
  const llm = Boolean(process.env.OPENAI_API_KEY);
  const supabase = hasSupabase();
  const [models, settings] = await Promise.all([fetchModels(), getSettings()]);
  const openaiModels = models.filter((m) => m.provider === "openai");

  return (
    <div className="mx-auto w-full max-w-5xl py-6 space-y-5">
      <header className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Evaluators</h1>
        <p className="text-text-secondary text-sm mt-2 max-w-xl mx-auto leading-relaxed">
          Configure the scoring engine, then run the claim pipeline and deterministic
          checks on any agent output and watch exactly what gets flagged.
        </p>
      </header>

      <EvaluatorConfig models={openaiModels} initial={settings} />
      <EvaluatorPlayground llm={llm} supabase={supabase} />
    </div>
  );
}
