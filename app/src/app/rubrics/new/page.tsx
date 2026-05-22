import Link from "next/link";
import { allProjects } from "@/lib/data";
import { NewRubricForm } from "./NewRubricForm";

export default function NewRubricPage() {
  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <div className="flex items-center gap-2 text-sm text-text-muted mb-1">
          <Link href="/rubrics" className="hover:text-brand">Rubrics</Link>
          <span>/</span>
          <span>New rubric</span>
        </div>
        <h1 className="text-2xl font-semibold">New rubric</h1>
        <p className="text-text-secondary text-sm mt-1">
          Define dimensions, weights, methods, and safety gates for an evaluation rubric.
        </p>
      </div>
      <NewRubricForm projects={allProjects} />
    </div>
  );
}
