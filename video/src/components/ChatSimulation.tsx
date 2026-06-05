import React from "react";
import { useCurrentFrame } from "remotion";
import { color, font } from "../theme";
import { typed, charsDone, reveal } from "./anim";
import type { ChatTurn } from "../data";

const roleMeta = {
  user: { who: "User", align: "flex-start" as const, bg: color.bgCardSolid, br: color.border, fg: color.text },
  agent: { who: "Agent", align: "flex-end" as const, bg: "rgba(59,130,246,0.10)", br: "rgba(59,130,246,0.35)", fg: color.text },
  tool: { who: "Tool call", align: "flex-start" as const, bg: "transparent", br: color.border, fg: color.accentBright },
};

// Sequential chat: each turn types out, then the next appears. Returns the
// frame at which the whole conversation finishes (for callers to chain).
export const conversationEnd = (turns: ChatTurn[], start: number, cps = 40) => {
  let t = start;
  for (const turn of turns) {
    t = charsDone(t, turn.text, cps) + 10; // gap between turns
  }
  return t;
};

export const ChatSimulation: React.FC<{
  turns: ChatTurn[];
  start?: number;
  cps?: number;
}> = ({ turns, start = 0, cps = 40 }) => {
  const frame = useCurrentFrame();

  // compute each turn's start frame
  let cursor = start;
  const starts = turns.map((turn) => {
    const s = cursor;
    cursor = charsDone(s, turn.text, cps) + 10;
    return s;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, width: "100%" }}>
      {turns.map((turn, i) => {
        const s = starts[i];
        if (frame < s) return null;
        const meta = roleMeta[turn.role];
        const shown = typed(frame, s, turn.text, cps);
        const isTool = turn.role === "tool";
        return (
          <div key={i} style={{ display: "flex", justifyContent: meta.align, ...reveal(frame, s, 14) }}>
            <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", gap: 6, alignItems: meta.align === "flex-end" ? "flex-end" : "flex-start" }}>
              <span style={{ fontFamily: font.mono, fontSize: 13, color: color.textMuted, letterSpacing: 0.6, textTransform: "uppercase" }}>
                {meta.who}
              </span>
              <div
                style={{
                  fontFamily: isTool ? font.mono : font.sans,
                  fontSize: isTool ? 19 : 23,
                  lineHeight: 1.4,
                  color: meta.fg,
                  background: meta.bg,
                  border: `1px solid ${turn.status === "ok" ? color.ok + "66" : meta.br}`,
                  borderRadius: isTool ? 9 : 16,
                  borderTopLeftRadius: meta.align === "flex-start" ? 4 : 16,
                  borderTopRightRadius: meta.align === "flex-end" ? 4 : 16,
                  padding: isTool ? "10px 14px" : "13px 18px",
                }}
              >
                {isTool && <span style={{ color: color.accent }}>→ </span>}
                {shown}
                {shown.length < turn.text.length && (
                  <span style={{ color: color.accent, opacity: (frame % 16) < 8 ? 1 : 0 }}>▋</span>
                )}
                {turn.status === "ok" && shown.length === turn.text.length && (
                  <span style={{ marginLeft: 8, color: color.ok, fontFamily: font.mono, fontSize: 15 }}>✓</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
