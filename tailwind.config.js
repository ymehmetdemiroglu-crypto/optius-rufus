/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "brutal-black": "#000000",
        "brutal-white": "#FFFFFF",
        "brutal-concrete": "#F0F0F0",
        "brutal-red": "#FF1A1A",
        "brutal-blue": "#0055FF",
        "brutal-yellow": "#FFCC00",
        "brand-bg": "#f5f0e8",
        "brand-dark": "#1a1a1a",
        "brand-gold": "#ff9900",
        "brand-red": "#e63b2e",
        "brand-blue": "#0055ff",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        display: ["Space Grotesk", "sans-serif"],
      },
      boxShadow: {
        "brutal": "6px 6px 0px #1a1a1a",
        "brutal-sm": "3px 3px 0px #1a1a1a",
        "brutal-gold": "6px 6px 0px #ff9900",
        "brutal-blue": "6px 6px 0px #0055ff",
        "brutal-red": "6px 6px 0px #e63b2e",
      },
    },
  },
  plugins: [],
};
