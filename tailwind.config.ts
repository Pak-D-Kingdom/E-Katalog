import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        forest: { 50: "#eff8f2", 100: "#d9eee0", 600: "#21804a", 700: "#17633a", 900: "#123d29" },
        cream: "#fbfaf6"
      },
      boxShadow: { soft: "0 16px 50px rgba(34, 57, 43, .08)" }
    }
  },
  plugins: []
};

export default config;
