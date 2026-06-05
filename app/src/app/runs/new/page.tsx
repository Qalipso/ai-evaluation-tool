import Link from "next/link";
import { fetchProjects, fetchRubrics, fetchModels } from "@/lib/db";
import { hasSupabase } from "@/lib/supabase";
import { NewRunForm } from "./NewRunForm";

export default async function NewRunPage() {
  const [projects, rubrics, models] = await Promise.all([
    fetchProjects(),
    fetchRubrics(),
    fetchModels(),
  ]);
  const enabled = hasSupabase();

  return (
    <div className="mx-auto w-full max-w-2xl px-1 py-6">
      <div className="mb-7 text-center">
        <div className="flex items-center justify-center gap-2 text-xs text-text-muted mb-3 tracking-wide">
          <Link href="/runs" className="hover:text-brand transition-colors">Runs</Link>
          <span className="opacity-40">/</span>
          <span className="text-text-secondary">New run</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">New evaluation run</h1>
        <p className="text-text-secondary text-sm mt-2 max-w-md mx-auto leading-relaxed">
          Set a master prompt, let the rubric generate questions, score candidate answers —
          all persisted as one run.
        </p>
      </div>

      {!enabled && (
        <div className="mb-5 rounded-xl bg-warn/10 border border-warn/25 px-4 py-3 text-sm text-warn text-center">
          Live evaluation needs Supabase + an OpenAI key.
        </div>
      )}

      <div className="elev-card p-7 sm:p-9">
        <NewRunForm projects={projects} rubrics={rubrics} models={models} />
      </div>
    </div>
  );
}
