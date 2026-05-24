"use client";

import { Download } from "lucide-react";

interface Props {
  markdown: string;
  filename: string;
}

export function ReportExport({ markdown, filename }: Props) {
  function download() {
    const blob = new Blob([markdown], { type: "text/markdown" });
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
      className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-hover rounded-md text-sm font-medium text-white transition-colors"
    >
      <Download size={14} />
      Download .md
    </button>
  );
}
