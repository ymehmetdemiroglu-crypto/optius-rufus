/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          crimson: {
            DEFAULT: '#E63946',
            glow: '#FF5E6C',
            muted: '#4A121A',
          },
          cyan: {
            DEFAULT: '#00F5FF',
            glow: '#5CFAFF',
            muted: '#003C40',
          },
          silver: {
            DEFAULT: '#E0E1DD',
            muted: '#8D99AE',
          },
          bg: {
            DEFAULT: '#05070A',
            card: '#0D111A',
            border: 'rgba(224, 225, 221, 0.08)',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Michroma', 'Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-crimson': '0 0 15px rgba(230, 57, 70, 0.4)',
        'glow-cyan': '0 0 15px rgba(0, 245, 255, 0.4)',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6', filter: 'drop-shadow(0 0 8px currentColor)' },
          '50%': { opacity: '1', filter: 'drop-shadow(0 0 20px currentColor)' },
        },
        'scan-bar': {
          '0%': { top: '0%' },
          '50%': { top: '100%' },
          '100%': { top: '0%' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s infinite ease-in-out',
        'scan-bar': 'scan-bar 4s infinite linear',
        'float': 'float 3s infinite ease-in-out',
      }
    },
  },
  plugins: [],
}
