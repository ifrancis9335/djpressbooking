import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        night: "#060914",
        carbon: "#0d1226",
        luxeBlue: "#31b5ff",
        luxePurple: "#8d64ff",
        luxeGold: "#f4c568"
      },
      boxShadow: {
        glow: "0 16px 40px rgba(49, 181, 255, 0.2)",
        panel: "0 24px 48px rgba(2, 5, 14, 0.5)"
      },
      borderRadius: {
        xl2: "1.25rem"
      }
    }
  },
  plugins: []
};

export default config;
