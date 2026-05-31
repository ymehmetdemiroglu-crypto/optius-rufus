/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brutal: {
          black: "#000000",
          white: "#FFFFFF",
          concrete: "#F0F0F0",
          red: "#FF1A1A",
          blue: "#0055FF",
          yellow: "#FFCC00",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
