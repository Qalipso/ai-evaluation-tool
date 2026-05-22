"use client";
import { useTransition } from "react";
import { deleteRubric } from "../actions";

export function DeleteRubricButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(`Delete rubric "${name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteRubric(id);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="px-3 py-1.5 text-sm text-bad border border-bad/30 rounded-md hover:bg-bad/10 disabled:opacity-50 transition-colors"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
