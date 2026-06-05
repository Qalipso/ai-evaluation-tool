import React from "react";
import { useCurrentFrame } from "remotion";
import { color, font } from "../theme";
import { reveal } from "./anim";
import type { FilmClaim, ClaimLabel } from "../data-film";

const labelColor: Record<ClaimLabel, string> = {
  supported: color.ok,
  partial: color.warn,
  unsupported: color.bad,
  contradicted: color.bad,
};
const labelText: Record<ClaimLabel, string> = {
  supported: "Supported",
  partial: "Partial",
  unsupported: "Unsupported",
  contradicted: "Contradicted",
};

type Seg = { text: string; claim?: FilmClaim; idx?: number };

// Split the answer into plain + claim segments, in source order.
const segment = (answer: string, claims: FilmClaim[]): Seg[] => {
  const segs: Seg[] = [];
  let rest = answer;
  let consumed = 0;
  claims.forEach((claim, i) => {
    const at = rest.indexOf(claim.text);
    if (at === -1) return;
    if (at > 0) segs.push({ text: rest.slice(0, at) });
    segs.push({ text: claim.text, claim, idx: i });
    rest = rest.slice(at + claim.text.length);
    consumed += at + claim.text.length;
  });
  if (rest) segs.push({ text: rest });
  return segs;
};

export const ClaimHighlighter: React.FC<{
  answer: string;
  claims: FilmClaim[];
  start: number;
  step?: number;
}> = ({ answer, claims, start, step = 26 }) => {
  const frame = useCurrentFrame();
  const segs = segment(answer, claims);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
      {/* answer with sweeping highlights */}
      <p style={{ margin: 0, fontFamily: font.sans, fontSize: 32, lineHeight: 1.6, color: color.text, fontWeight: 500 }}>
        {segs.map((s, i) => {
          if (!s.claim) return <span key={i}>{s.text}</span>;
          const at = start + (s.idx ?? 0) * step;
          const active = frame >= at;
          const c = labelColor[s.claim.label];
          return (
            <span
              key={i}
              style={{
                background: active ? `${c}22` : "transparent",
                borderBottom: `2px solid ${active ? c : "transparent"}`,
                borderRadius: 4,
                padding: "1px 4px",
                color: active ? color.text : color.textSecondary,
                transition: "all 0.3s",
              }}
            >
              {s.text}
            </span>
          );
        })}
      </p>

      {/* claim verdict chips */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {claims.map((claim, i) => {
          const at = start + i * step + 8;
          if (frame < at) return null;
          const c = labelColor[claim.label];
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, ...reveal(frame, at, 14) }}>
              <span style={{ width: 9, height: 9, borderRadius: 99, background: c, boxShadow: `0 0 10px ${c}` }} />
              <span style={{ flex: 1, fontFamily: font.mono, fontSize: 18, color: color.textSecondary }}>
                "{claim.text}"
              </span>
              <span style={{ fontFamily: font.mono, fontSize: 15, color: color.textMuted }}>{claim.confidence.toFixed(2)}</span>
              <span style={{ fontFamily: font.mono, fontSize: 15, color: c, border: `1px solid ${c}44`, background: `${c}14`, padding: "4px 12px", borderRadius: 7, minWidth: 130, textAlign: "center" }}>
                {labelText[claim.label]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
