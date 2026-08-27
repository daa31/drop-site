import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111214",
        graphite: "#2A2D33",
        mist: "#F4F5F7",
        accent: "#C45C26",
        accentHover: "#A84B1C",
      },
      fontFamily: {
        sans: ["var(--font-geist)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(17,18,20,0.06), 0 8px 24px rgba(17,18,20,0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
