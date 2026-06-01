/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "brutal-black": "#0a0a0a",
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
        "terminal-green": "#00ff88",
        "terminal-bg": "#0d1117",
        "chat-buyer": "#e8f0fe",
        "chat-rufus": "#fff4e6",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        display: ["Space Grotesk", "sans-serif"],
      },
      boxShadow: {
        brutal: "6px 6px 0px #1a1a1a",
        "brutal-sm": "3px 3px 0px #1a1a1a",
        "brutal-gold": "6px 6px 0px #ff9900",
        "brutal-blue": "6px 6px 0px #0055ff",
        "brutal-red": "6px 6px 0px #e63b2e",
        "brutal-lg": "10px 10px 0px #1a1a1a",
      },
      keyframes: {
        "count-up": {
          "0%": { "--count-val": "0" },
          "100%": { "--count-val": "var(--count-target, 100)" },
        },
        "gauge-fill": {
          "0%": { width: "0%" },
          "100%": { width: "var(--gauge-width, 50%)" },
        },
        typewriter: {
          "0%": { width: "0" },
          "100%": { width: "100%" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        "pulse-red": {
          "0%, 100%": { color: "#FF1A1A" },
          "50%": { color: "#cc0000" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(40px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(60px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.85)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "scan-line": {
          "0%": { top: "0%" },
          "100%": { top: "100%" },
        },
        "tick-up": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "gauge-fill": "gauge-fill 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        typewriter: "typewriter 2s steps(40, end) forwards",
        blink: "blink 1s step-end infinite",
        "pulse-red": "pulse-red 2s ease-in-out infinite",
        "slide-up": "slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-in-right": "slide-in-right 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in": "fade-in 0.6s ease-out forwards",
        "scale-in": "scale-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "scan-line": "scan-line 2s linear infinite",
        "tick-up": "tick-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        shimmer: "shimmer 2s linear infinite",
        "float-slow": "float-slow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
