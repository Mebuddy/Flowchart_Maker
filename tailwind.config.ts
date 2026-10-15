import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        canvas: {
          bg: "#0B0F19",
          dot: "#1E293B",
          panel: "#111827",
          border: "#1F2937",
        },
      },
    },
  },
  plugins: [],
};

export default config;
