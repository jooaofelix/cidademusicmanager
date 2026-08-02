import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0a0a0f",
          900: "#101018",
          850: "#16161f",
          800: "#1c1c27",
          700: "#272733",
          600: "#3a3a48",
        },
        brand: {
          50: "#eef6ff",
          100: "#d9ecff",
          200: "#bcdcff",
          300: "#8ec5ff",
          400: "#59a4ff",
          500: "#3381fb",
          600: "#1f61f0",
          700: "#194bdc",
          800: "#1b3fb2",
          900: "#1c398c",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto",
          "Helvetica Neue", "Arial", "system-ui", "sans-serif",
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
