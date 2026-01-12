import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        surface: colors.zinc,
        accent: colors.emerald,
        brand: {
          50: "#effaf4",
          100: "#d8f5e6",
          200: "#b2ebcc",
          300: "#7fddb0",
          400: "#45c992",
          500: "#1ea574",
          600: "#168460",
          700: "#12684f",
          800: "#0f5341",
          900: "#0d4536",
          950: "#05281f"
        }
      },
      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.2rem"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(15,23,42,0.18)"
      }
    }
  },
  plugins: []
};

export default config;
