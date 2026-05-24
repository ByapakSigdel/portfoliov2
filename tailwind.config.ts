import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#f5ecd7",
        panel: "#ffffff",
        ink: "#0a0d0a",
        muted: "#2a2a22",
        line: "#0a0d0a",
        dino: { green: "#4a8f3d", deep: "#2a5a22" },
        orange: { spike: "#e8743a", deep: "#b04a18" },
        peach: "#f0b388",
      },
      fontFamily: {
        pixel: ["var(--font-pixel)", "monospace"],
        mono: ["var(--font-mono)", "monospace"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
