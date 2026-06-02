import Link from "next/link";
import { Card } from "@/components/ui";
import { fetchProjects, fetchRubrics } from "@/lib/db";
import { hasSupabase } from "@/lib/supabase";
import { NewRunForm } from "./NewRunForm";

export default async function NewRunPage() {
  const [projects, rubrics] = await Promise.all([fetchProjects(), fetchRubrics()]);
  const enabled = hasSupabase();

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <div className="flex items-center gap-2 text-sm text-text-muted mb-1">
          <Link href="/runs" className="hover:text-brand">Runs</Link>
          <span>/</span>
          <span>New run</span>
        </div>
        <h1 className="text-2xl font-semibold">New evaluation run</h1>
        <p className="text-text-secondary text-sm mt-1">
          Score a single AI output against a rubric. LLM-judge dimensions call a real model;
          deterministic dimensions run in code. Results persist as a new run.
        </p>
      </div>

      {!enabled && (
        <div className="rounded-md bg-warn/10 border border-warn/30 px-4 py-3 text-sm text-warn">
          Live evaluation needs Supabase + an OpenAI key. Set <code>SUPABASE_URL</code>,{" "}
          <code>SUPABASE_SERVICE_ROLE_KEY</code> and <code>OPENAI_API_KEY</code> to enable it.
        </div>
      )}

      <Card className="p-5">
        <NewRunForm projects={projects} rubrics={rubrics} />
      </Card>
    </div>
  );
}
