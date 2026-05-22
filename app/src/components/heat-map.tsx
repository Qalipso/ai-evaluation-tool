import clsx from "clsx";
import { Claim, labelHeatClass } from "@/lib/data";

export function HeatMap({
  output,
  claims,
}: {
  output: string;
  claims: Claim[];
}) {
  type Seg = { start: number; end: number; label?: string; claim?: Claim };
  const indices: Seg[] = [];
  claims.forEach((c) => {
    const i = output.indexOf(c.text);
    if (i >= 0) indices.push({ start: i, end: i + c.text.length, label: c.label, claim: c });
  });
  indices.sort((a, b) => a.start - b.start);

  const segs: Seg[] = [];
  let cursor = 0;
  for (const s of indices) {
    if (s.start > cursor) segs.push({ start: cursor, end: s.start });
    segs.push(s);
    cursor = s.end;
  }
  if (cursor < output.length) segs.push({ start: cursor, end: output.length });

  return (
    <div className="leading-relaxed text-sm whitespace-pre-wrap">
      {segs.map((s, i) => {
        const text = output.slice(s.start, s.end);
        if (!s.label) return <span key={i}>{text}</span>;
        return (
          <span
            key={i}
            className={clsx("px-0.5 rounded-sm", labelHeatClass[s.label])}
            title={`${s.label} · confidence ${s.claim?.confidence.toFixed(2)}`}
          >
            {text}
          </span>
        );
      })}
    </div>
  );
}
