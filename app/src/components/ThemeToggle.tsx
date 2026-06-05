"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // ignore
    }
  }

  return (
    <button
      onClick={toggle}
      title={dark ? "Switch to light" : "Switch to dark"}
      aria-label="Toggle theme"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle bg-bg-card text-text-secondary hover:text-brand hover:border-brand/40 transition-colors"
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
