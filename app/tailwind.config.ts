import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#0b0b14",
          panel: "#11111c",
          card: "#161624",
          hover: "#1c1c2e",
        },
        border: {
          subtle: "#23233a",
          strong: "#2e2e4a",
        },
        text: {
          primary: "#e7e7f0",
          secondary: "#a3a3b8",
          muted: "#6b6b85",
        },
        brand: {
          DEFAULT: "#7c6cff",
          hover: "#9183ff",
          subtle: "#3a2f8a",
        },
        ok: "#3ecf8e",
        warn: "#f5a524",
        bad: "#ef4444",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Inter", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
