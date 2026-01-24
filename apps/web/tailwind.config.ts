import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          50: "#effaf3",
          100: "#d8f2e2",
          200: "#b8e7cb",
          300: "#86d8aa",
          400: "#4fc082",
          500: "#24a05f",
          600: "#19834b",
          700: "#15683e",
          800: "#135335",
          900: "#0f3f29",
          950: "#072416"
        }
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
        "3xl": "20px"
      },
      boxShadow: {
        soft: "0 20px 50px -30px rgba(7, 36, 22, 0.35)",
        glow: "0 0 0 6px rgba(36, 160, 95, 0.15)"
      }
    }
  },
  plugins: []
};

export default config;
