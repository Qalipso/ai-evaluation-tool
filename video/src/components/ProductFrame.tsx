import React from "react";
import { color, font } from "../theme";

// App-window chrome: a sidebar-less, premium devtool surface with a top bar.
// Children render inside the workspace area.
export const ProductFrame: React.FC<{
  title: string;
  badge?: { text: string; tone?: "accent" | "ok" | "warn" | "bad" };
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ title, badge, children, style }) => {
  const toneColor =
    badge?.tone === "ok"
      ? color.ok
      : badge?.tone === "warn"
        ? color.warn
        : badge?.tone === "bad"
          ? color.bad
          : color.accent;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 22,
        background: "linear-gradient(180deg,#0c1120,#080b14)",
        border: `1px solid ${color.border}`,
        boxShadow: `0 50px 120px -40px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.02) inset`,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      {/* top bar */}
      <div
        style={{
          height: 64,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "0 26px",
          borderBottom: `1px solid ${color.border}`,
          background: "rgba(255,255,255,0.015)",
        }}
      >
        <div style={{ display: "flex", gap: 9 }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <div key={c} style={{ width: 13, height: 13, borderRadius: 99, background: c, opacity: 0.85 }} />
          ))}
        </div>
        <div style={{ width: 1, height: 26, background: color.border, marginLeft: 6 }} />
        <span style={{ fontFamily: font.sans, color: color.textSecondary, fontSize: 20, fontWeight: 600, letterSpacing: -0.2 }}>
          {title}
        </span>
        <div style={{ flex: 1 }} />
        {badge && (
          <span
            style={{
              fontFamily: font.mono,
              fontSize: 15,
              color: toneColor,
              border: `1px solid ${toneColor}40`,
              background: `${toneColor}14`,
              padding: "5px 12px",
              borderRadius: 8,
              letterSpacing: 0.4,
            }}
          >
            {badge.text}
          </span>
        )}
      </div>
      {/* workspace */}
      <div style={{ flex: 1, minHeight: 0, padding: 30, display: "flex" }}>{children}</div>
    </div>
  );
};

export const Pill: React.FC<{ children: React.ReactNode; tone?: "accent" | "ok" | "warn" | "bad" | "muted" }> = ({
  children,
  tone = "muted",
}) => {
  const c =
    tone === "ok" ? color.ok : tone === "warn" ? color.warn : tone === "bad" ? color.bad : tone === "accent" ? color.accent : color.textMuted;
  return (
    <span
      style={{
        fontFamily: font.mono,
        fontSize: 14,
        color: c,
        border: `1px solid ${c}33`,
        background: `${c}12`,
        padding: "4px 10px",
        borderRadius: 7,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
};
