import type { Config } from "tailwindcss";

// As cores de superfície (ink) e de texto (slate) apontam para variáveis CSS,
// definidas em globals.css para cada aparência. É isso que permite trocar
// entre claro e escuro sem tocar em nenhuma tela: as classes continuam
// text-slate-500, bg-ink-850 e assim por diante, e só o valor por trás muda.
//
// Nas duas aparências a escala guarda o mesmo sentido: ink-950 é o fundo mais
// afastado e ink-600 o mais próximo; slate-100 é o texto de maior contraste e
// slate-600 o de menor. No claro isso dá números invertidos em relação ao
// escuro, e é de propósito.
const cor = (nome: string) => `rgb(var(--${nome}) / <alpha-value>)`;

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: cor("ink-950"),
          900: cor("ink-900"),
          850: cor("ink-850"),
          800: cor("ink-800"),
          700: cor("ink-700"),
          600: cor("ink-600"),
        },
        slate: {
          100: cor("txt-100"),
          200: cor("txt-200"),
          300: cor("txt-300"),
          400: cor("txt-400"),
          500: cor("txt-500"),
          600: cor("txt-600"),
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
