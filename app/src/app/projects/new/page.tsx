import Link from "next/link";
import { fetchModels } from "@/lib/db";
import { NewProjectForm } from "./NewProjectForm";

export default async function NewProjectPage() {
  const allModels = await fetchModels();
  return (
    <div className="max-w-xl space-y-5">
      <div>
        <div className="flex items-center gap-2 text-sm text-text-muted mb-1">
          <Link href="/projects" className="hover:text-brand">Projects</Link>
          <span>/</span>
          <span>New project</span>
        </div>
        <h1 className="text-2xl font-semibold">New project</h1>
        <p className="text-text-secondary text-sm mt-1">
          Define the model, rubric, and dataset for a new evaluation project.
        </p>
      </div>

      <NewProjectForm models={allModels} />
    </div>
  );
}
