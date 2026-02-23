import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        brand: {
          950: "#06122B",
          900: "#0A1F44",
          800: "#133061",
          100: "#EAF0FA",
        },
        swiss: {
          red: "#D52B1E",
          soft: "#FCE9E8",
        },
        neutral: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          600: "#475569",
          700: "#334155",
          900: "#0F172A",
        },
      },
      borderRadius: {
        xl: "0.875rem",
      },
      boxShadow: {
        card: "0 8px 24px rgba(10, 31, 68, 0.08)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
