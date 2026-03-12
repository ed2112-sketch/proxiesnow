import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#1a2b4a",
          50: "#f0f3f8",
          100: "#d9e0ed",
          200: "#b3c1db",
          300: "#8da2c9",
          400: "#6783b7",
          500: "#4164a5",
          600: "#345084",
          700: "#273c63",
          800: "#1a2b4a",
          900: "#0d1525",
        },
        accent: {
          DEFAULT: "#2ecc71",
          50: "#eafaf1",
          100: "#d5f5e3",
          200: "#abebc6",
          300: "#82e0aa",
          400: "#58d68d",
          500: "#2ecc71",
          600: "#25a35a",
          700: "#1c7a44",
          800: "#12522d",
          900: "#092917",
        },
        gray: {
          50: "#f5f7fa",
        },
      },
    },
  },
  plugins: [],
};

export default config;
