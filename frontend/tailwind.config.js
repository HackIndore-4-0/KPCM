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
        earth: {
          950: '#090807', // Deepest warm obsidian
          900: '#121110', // Dark warm charcoal
          850: '#171513', // Elevated card surface
          800: '#1f1c19', // Card surface active
          750: '#262320', // Border subtle
          700: '#332f2a', // Border default
          600: '#47423c', // Border prominent
          500: '#635c54', // Muted text secondary
          400: '#8c8276', // Muted text primary
          300: '#b8ae9f', // Light body text
          200: '#d9d2c7', // Off-white
          100: '#eeeae4', // Clean warm white
          50:  '#faf8f5', // Brightest highlights
        },
        bronze: {
          300: '#fde68a',
          400: '#fbbf24',
          500: '#d97706',
          600: '#b45309',
          700: '#78350f',
        },
        sage: {
          400: '#86efac',
          500: '#22c55e',
          600: '#16a34a',
        },
        terracotta: {
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
        }
      },
      animation: {
        'vortex-spin': 'vortex 120s linear infinite',
        'pulse-subtle': 'pulseSlow 4s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer-earth': 'shimmerEarth 3s linear infinite',
      },
      keyframes: {
        vortex: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '0.9', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(0.98)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmerEarth: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      },
      boxShadow: {
        'earth-sm': '0 2px 8px -1px rgba(0, 0, 0, 0.7)',
        'earth-md': '0 8px 24px -2px rgba(0, 0, 0, 0.8), 0 0 1px 1px rgba(255, 255, 255, 0.05)',
        'earth-lg': '0 16px 40px -4px rgba(0, 0, 0, 0.9), 0 0 1px 1px rgba(217, 119, 6, 0.1)',
        'glow-bronze': '0 0 30px -5px rgba(217, 119, 6, 0.25)',
        'glow-sage': '0 0 30px -5px rgba(34, 197, 94, 0.2)',
      }
    },
  },
  plugins: [],
}
