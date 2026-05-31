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
          orange: {
            DEFAULT: '#FF6B00',
            glow: '#FF8533',
            muted: '#4A270D',
          },
          violet: {
            DEFAULT: '#8B5CF6',
            glow: '#A78BFA',
            muted: '#2E1E5B',
          },
          cyan: {
            DEFAULT: '#06B6D4',
            glow: '#22D3EE',
            muted: '#0F3C4B',
          },
          bg: {
            DEFAULT: '#0A0D14',
            card: '#151B26',
            border: 'rgba(255, 255, 255, 0.08)',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'glow-orange': '0 0 15px rgba(255, 107, 0, 0.4)',
        'glow-violet': '0 0 15px rgba(139, 92, 246, 0.4)',
        'glow-cyan': '0 0 15px rgba(6, 182, 212, 0.4)',
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
