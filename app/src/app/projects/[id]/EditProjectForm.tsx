"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";
import type { Project, AIModel, Rubric } from "@/lib/data";
import { updateProject } from "../actions";
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

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <span className="text-[10px] uppercase tracking-wide font-semibold text-text-muted">{label}</span>
      <div className="flex-1 h-px bg-border-subtle" />
    </div>
  );
}

export function EditProjectForm({
  project,
  models,
  rubrics,
}: {
  project: Project;
  models: AIModel[];
  rubrics: Rubric[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateProject(project.id, fd);
    });
  }

  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold mb-4">Project Settings</h2>
      <form onSubmit={handleSubmit} className="space-y-3.5">

        <SectionDivider label="Identity" />

        <Field
          label="Name" name="name" defaultValue={project.name} required
          tooltip="Human-readable project name shown in lists and reports."
        />
        <Field
          label="Description" name="description" defaultValue={project.description}
          tooltip="One-line summary of what AI behavior this project evaluates."
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Owner" name="owner" defaultValue={project.owner} required
            tooltip="Team or person responsible for this project's evaluations."
          />
          <div>
            <label className="block text-xs text-text-muted mb-1">
              Status
              <InfoTip text="active: running evaluations. paused: no new runs. archived: read-only." />
            </label>
            <select
              name="status"
              defaultValue={project.status ?? "active"}
              className="w-full px-3 py-2 bg-bg-panel border border-border-subtle rounded-md text-sm focus:outline-none focus:border-brand"
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <SectionDivider label="Evaluation Defaults" />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-text-muted mb-1">
              Default model<span className="text-bad ml-0.5">*</span>
              <InfoTip text="The AI model being evaluated. Used as default for new runs." />
            </label>
            <ModelSelect name="model" defaultValue={project.model} initialModels={models} />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">
              Active rubric
              <InfoTip text="Rubric used for scoring runs. Changing this affects all future runs — existing run scores are unaffected." />
            </label>
            <select
              name="active_rubric"
              defaultValue={project.active_rubric}
              className="w-full px-3 py-2 bg-bg-panel border border-border-subtle rounded-md text-sm focus:outline-none focus:border-brand font-mono"
            >
              <option value="">— none —</option>
              {rubrics.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} v{r.version}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">
            Judge model
            <InfoTip text="LLM used as evaluator for llm_judge dimensions. Leave empty to use the same model as default." />
          </label>
          <ModelSelect name="judge_model" defaultValue={project.judge_model ?? ""} initialModels={models} />
        </div>

        <SectionDivider label="Metadata" />

        <Field
          label="Tags" name="tags" defaultValue={project.tags ?? ""}
          placeholder="rag, production, customer-facing"
          tooltip="Comma-separated labels for filtering and grouping projects."
        />
        <TextareaField
          label="Notes" name="notes" defaultValue={project.notes ?? ""}
          placeholder="Internal notes about this project's evaluation strategy, known issues, etc."
          tooltip="Free-text field for team context. Not shown in public reports."
        />

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="px-4 py-2 bg-brand hover:bg-brand-hover disabled:opacity-50 rounded-md text-sm font-medium transition-colors"
          >
            {pending ? "Saving…" : "Save changes"}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/projects/${project.id}`)}
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
  label, name, defaultValue, required, placeholder, mono, tooltip,
}: {
  label: string; name: string; defaultValue?: string | number;
  required?: boolean; placeholder?: string; mono?: boolean; tooltip?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-text-muted mb-1">
        {label}{required && <span className="text-bad ml-0.5">*</span>}
        {tooltip && <InfoTip text={tooltip} />}
      </label>
      <input
        name={name}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        className={`w-full px-3 py-2 bg-bg-panel border border-border-subtle rounded-md text-sm focus:outline-none focus:border-brand transition-colors ${mono ? "font-mono" : ""}`}
      />
    </div>
  );
}

function TextareaField({
  label, name, defaultValue, placeholder, tooltip,
}: {
  label: string; name: string; defaultValue?: string;
  placeholder?: string; tooltip?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-text-muted mb-1">
        {label}
        {tooltip && <InfoTip text={tooltip} />}
      </label>
      <textarea
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        rows={3}
        className="w-full px-3 py-2 bg-bg-panel border border-border-subtle rounded-md text-sm focus:outline-none focus:border-brand transition-colors resize-none"
      />
    </div>
  );
}
