"use client";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";
import type { AIModel } from "@/lib/data";
import { createProject } from "../actions";
import { ModelSelect } from "../ModelSelect";

function InfoTip({ text }: { text: string }) {
  return (
    <span className="relative inline-flex items-center group/tip ml-1 align-middle">
      <span className="text-[10px] leading-none w-3.5 h-3.5 flex items-center justify-center rounded-full border border-text-muted text-text-muted cursor-help select-none">?</span>
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-52 px-2.5 py-2 bg-bg-hover border border-border-subtle rounded-md text-[11px] text-text-secondary leading-snug opacity-0 group-hover/tip:opacity-100 pointer-events-none z-20 whitespace-normal transition-opacity shadow-lg">
        {text}
      </span>
    </span>
  );
}

export function NewProjectForm({ models }: { models: AIModel[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await createProject(fd);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    });
  }

  return (
    <Card className="p-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="px-3 py-2 bg-bad/10 border border-bad/30 rounded-md text-sm text-bad">
            {error}
          </div>
        )}

        <Field
          label="Project ID"
          name="id"
          placeholder="my-project-name"
          hint="Unique slug, lowercase, hyphens OK"
          required
          mono
          tooltip="Unique identifier used in URLs and API references. Use kebab-case, e.g. rag-docs-qa."
        />
        <Field
          label="Name"
          name="name"
          placeholder="My AI Project"
          required
          tooltip="Human-readable project name shown in lists and reports."
        />
        <Field
          label="Description"
          name="description"
          placeholder="Short description of what this project evaluates"
          tooltip="One-line summary of what AI behavior this project evaluates. Shown in the project card."
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Owner"
            name="owner"
            placeholder="platform-team"
            required
            tooltip="Team or person responsible for this project's evaluations and rubric maintenance."
          />
          <div>
            <label className="block text-xs text-text-muted mb-1">
              Model<span className="text-bad ml-0.5">*</span>
              <InfoTip text="The AI model being evaluated. Select from connected models or add a custom model ID." />
            </label>
            <ModelSelect name="model" initialModels={models} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Active rubric ID"
            name="active_rubric"
            placeholder="rubric-v1.0"
            mono
            tooltip="ID of the rubric currently used for scoring runs in this project. Must match an existing rubric ID exactly."
          />
          <Field
            label="Total cases"
            name="cases_total"
            placeholder="0"
            type="number"
            tooltip="Expected number of test cases in the evaluation dataset. Used for progress tracking and coverage metrics."
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="px-4 py-2 bg-brand hover:bg-brand-hover disabled:opacity-50 rounded-md text-sm font-medium transition-colors"
          >
            {pending ? "Creating…" : "Create project"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/projects")}
            className="px-4 py-2 border border-border-subtle hover:bg-bg-hover rounded-md text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </Card>
  );
}

function Field({
  label,
  name,
  placeholder,
  hint,
  required,
  type = "text",
  mono,
  tooltip,
}: {
  label: string;
  name: string;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  type?: string;
  mono?: boolean;
  tooltip?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-text-muted mb-1">
        {label}
        {required && <span className="text-bad ml-0.5">*</span>}
        {tooltip && <InfoTip text={tooltip} />}
      </label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        required={required}
        className={`w-full px-3 py-2 bg-bg-panel border border-border-subtle rounded-md text-sm focus:outline-none focus:border-brand transition-colors ${mono ? "font-mono" : ""}`}
      />
      {hint && <p className="mt-1 text-[11px] text-text-muted">{hint}</p>}
    </div>
  );
}
