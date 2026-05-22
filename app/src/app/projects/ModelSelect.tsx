"use client";
import { useState, useTransition, useRef, useEffect } from "react";
import { ChevronDown, Plus, Check } from "lucide-react";
import type { AIModel } from "@/lib/data";
import { addModel } from "./actions";

const PROVIDER_ORDER = ["openai", "anthropic", "google", "meta", "custom"];
const PROVIDER_LABEL: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
  meta: "Meta",
  custom: "Custom",
};

export function ModelSelect({
  name,
  defaultValue,
  initialModels,
}: {
  name: string;
  defaultValue?: string;
  initialModels: AIModel[];
}) {
  const [models, setModels] = useState<AIModel[]>(initialModels ?? []);
  const [selected, setSelected] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const [addingNew, setAddingNew] = useState(false);
  const [newId, setNewId] = useState("");
  const [newProvider, setNewProvider] = useState("custom");
  const [newLabel, setNewLabel] = useState("");
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setAddingNew(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const safeModels = Array.isArray(models) ? models : [];

  const grouped = PROVIDER_ORDER.reduce<Record<string, AIModel[]>>((acc, p) => {
    const items = safeModels.filter((m) => m.provider === p);
    if (items.length) acc[p] = items;
    return acc;
  }, {});

  const selectedModel = safeModels.find((m) => m.id === selected);

  function handleSelect(id: string) {
    setSelected(id);
    setOpen(false);
    setAddingNew(false);
  }

  function handleAdd() {
    const id = newId.trim().toLowerCase();
    if (!id) return;
    startTransition(async () => {
      await addModel(id, newProvider, newLabel || id);
      const newEntry: AIModel = {
        id,
        provider: newProvider || "custom",
        label: newLabel.trim() || id,
      };
      setModels((prev) => {
        if (prev.some((m) => m.id === id)) return prev;
        return [...prev, newEntry];
      });
      setSelected(id);
      setAddingNew(false);
      setNewId("");
      setNewLabel("");
      setNewProvider("custom");
      setOpen(false);
    });
  }

  return (
    <div ref={ref} className="relative">
      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={selected} />

      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setAddingNew(false); }}
        className="w-full flex items-center justify-between px-3 py-2 bg-bg-panel border border-border-subtle rounded-md text-sm font-mono focus:outline-none focus:border-brand transition-colors"
      >
        <span className={selected ? "text-text-primary" : "text-text-muted"}>
          {selectedModel ? selectedModel.label : "Select model…"}
        </span>
        <ChevronDown size={14} className="text-text-muted shrink-0 ml-2" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[260px] bg-bg-card border border-border-subtle rounded-md shadow-lg overflow-hidden">
          <div className="max-h-64 overflow-y-auto py-1">
            {Object.entries(grouped).map(([provider, items]) => (
              <div key={provider}>
                <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-text-muted font-medium bg-bg-panel border-b border-border-subtle">
                  {PROVIDER_LABEL[provider] ?? provider}
                </div>
                {items.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelect(m.id)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-bg-hover transition-colors text-left"
                  >
                    <div>
                      <div className="font-medium">{m.label}</div>
                      <div className="text-[10px] text-text-muted font-mono">{m.id}</div>
                    </div>
                    {selected === m.id && <Check size={13} className="text-brand shrink-0" />}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Add model */}
          <div className="border-t border-border-subtle">
            {!addingNew ? (
              <button
                type="button"
                onClick={() => setAddingNew(true)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-brand hover:bg-bg-hover transition-colors"
              >
                <Plus size={13} />
                Add model…
              </button>
            ) : (
              <div className="p-3 space-y-2">
                <input
                  autoFocus
                  type="text"
                  placeholder="Model ID (e.g. gpt-5)"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
                  className="w-full px-2 py-1.5 text-xs font-mono bg-bg-panel border border-border-subtle rounded focus:outline-none focus:border-brand"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Label (optional)"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="flex-1 px-2 py-1.5 text-xs bg-bg-panel border border-border-subtle rounded focus:outline-none focus:border-brand"
                  />
                  <select
                    value={newProvider}
                    onChange={(e) => setNewProvider(e.target.value)}
                    className="px-2 py-1.5 text-xs bg-bg-panel border border-border-subtle rounded focus:outline-none focus:border-brand"
                  >
                    {PROVIDER_ORDER.map((p) => (
                      <option key={p} value={p}>{PROVIDER_LABEL[p] ?? p}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAdd}
                    disabled={!newId.trim() || pending}
                    className="px-3 py-1 text-xs bg-brand hover:bg-brand-hover disabled:opacity-40 rounded font-medium transition-colors"
                  >
                    {pending ? "Adding…" : "Add"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAddingNew(false); setNewId(""); setNewLabel(""); }}
                    className="px-3 py-1 text-xs border border-border-subtle hover:bg-bg-hover rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
