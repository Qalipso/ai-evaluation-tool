"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteDataset } from "../actions";

export function DeleteDatasetButton({ id }: { id: string }) {
  const [confirm, setConfirm] = useState(false);
  return confirm ? (
    <div className="flex items-center gap-2">
      <span className="text-xs text-text-muted">Delete?</span>
      <button onClick={() => deleteDataset(id)} className="btn-pill bg-bad text-white px-3 py-1.5 text-xs">Yes</button>
      <button onClick={() => setConfirm(false)} className="btn-pill btn-ghost px-3 py-1.5 text-xs">No</button>
    </div>
  ) : (
    <button onClick={() => setConfirm(true)} className="btn-pill btn-ghost inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs">
      <Trash2 size={13} /> Delete
    </button>
  );
}
