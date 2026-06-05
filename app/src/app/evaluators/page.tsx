import { fetchModels, getSettings } from "@/lib/db";
import { hasSupabase } from "@/lib/supabase";
import { EvaluatorsClient } from "./EvaluatorsClient";

export default async function EvaluatorsPage() {
  const [models, settings] = await Promise.all([fetchModels(), getSettings()]);
  const openaiModels = models.filter((m) => m.provider === "openai");

  return (
    <div className="mx-auto w-full max-w-3xl py-6">
      <header className="mb-7 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Evaluators</h1>
        <p className="text-text-secondary text-sm mt-2 max-w-lg mx-auto leading-relaxed">
          Configure and test each scoring method. Every method is real — LLM judge, claim
          pipeline (groundedness), and deterministic checks. Human dimensions go to the review queue.
        </p>
      </header>

      {!hasSupabase() && (
        <div className="mb-5 rounded-xl bg-warn/10 border border-warn/25 px-4 py-3 text-sm text-warn text-center">
          Settings persistence needs Supabase. Live tests need an OpenAI key.
        </div>
      )}

      <EvaluatorsClient
        models={openaiModels.length ? openaiModels : [{ id: "gpt-4o-mini", provider: "openai", label: "GPT-4o mini" }]}
        initial={settings}
      />
    </div>
  );
}
