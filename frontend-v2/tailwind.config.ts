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
        accent: colors.fuchsia,
        brand: {
          50: "#f4fbff",
          100: "#e4f4ff",
          200: "#c4e6ff",
          300: "#9bd3ff",
          400: "#6cb6ff",
          500: "#428fff",
          600: "#2c6be6",
          700: "#214fba",
          800: "#1f4294",
          900: "#1d3877"
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
