"use client";

import { Download } from "lucide-react";

export function DownloadButton({
  text,
  filename,
  label = "Download .txt",
}: {
  text: string;
  filename: string;
  label?: string;
}) {
  function download() {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={download}
      className="btn-pill btn-ghost inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs"
    >
      <Download size={13} /> {label}
    </button>
  );
}
