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
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
