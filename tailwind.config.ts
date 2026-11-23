import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#12132b",
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        mint: {
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
        },
      },
      boxShadow: {
        soft: "0 10px 40px -12px rgba(31, 41, 55, 0.18)",
        card: "0 1px 0 0 rgba(17, 24, 39, 0.04), 0 8px 30px -12px rgba(17, 24, 39, 0.12)",
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pop": {
          "0%": { transform: "scale(0.96)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "bar": {
          "0%": { width: "0%" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.35s ease-out both",
        "pop": "pop 0.25s ease-out both",
        "bar": "bar 0.6s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
