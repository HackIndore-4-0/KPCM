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
        // Dark neon surface scale
        surface: {
          950: '#05060a',
          900: '#080a10',
          800: '#0d0f18',
          750: '#10121e',
          700: '#141728',
          600: '#1c2038',
        },
        // Neon accent: electric cyan
        cyan: {
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#00f0ff',
          600: '#00c8d4',
        },
        // Neon accent: violet/magenta
        violet: {
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#b026ff',
          600: '#7c3aed',
        },
        // Status: emerald for success
        emerald: {
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
        },
        // Status: amber for warning
        amber: {
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
        },
        // Status: rose for error
        rose: {
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
        },
        // Legacy earth scale kept for backward compat
        earth: {
          950: '#090807',
          900: '#121110',
          850: '#171513',
          800: '#1f1c19',
          750: '#262320',
          700: '#332f2a',
          600: '#47423c',
          500: '#635c54',
          400: '#8c8276',
          300: '#b8ae9f',
          200: '#d9d2c7',
          100: '#eeeae4',
          50:  '#faf8f5',
        },
      },
      fontFamily: {
        sans: ['Georgia', '"Times New Roman"', 'Times', 'serif'],
        serif: ['Georgia', '"Times New Roman"', 'Times', 'serif'],
        mono: ['Georgia', '"Times New Roman"', 'Times', 'serif'],
      },
      letterSpacing: {
        tighter: '-0.04em',
        tight: '-0.02em',
      },
      animation: {
        // Existing
        'vortex-spin': 'vortex 120s linear infinite',
        'pulse-subtle': 'pulseSlow 4s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer-earth': 'shimmerEarth 3s linear infinite',
        // New neon animations
        'pulse-live': 'pulseLive 2s ease-in-out infinite',
        'dash-flow': 'dashFlow 2s linear infinite',
        'sheen': 'sheen 3s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2.5s ease-in-out infinite',
        'connector-pulse': 'connectorPulse 2s ease-in-out infinite',
        'illuminate': 'illuminate 0.5s ease-out forwards',
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
        },
        pulseLive: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.85)' },
        },
        dashFlow: {
          '0%': { strokeDashoffset: '24' },
          '100%': { strokeDashoffset: '0' },
        },
        sheen: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 8px 2px rgba(0,240,255,0.15)' },
          '50%': { boxShadow: '0 0 20px 6px rgba(0,240,255,0.35)' },
        },
        connectorPulse: {
          '0%': { strokeDashoffset: '200' },
          '100%': { strokeDashoffset: '0' },
        },
        illuminate: {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      boxShadow: {
        // Legacy
        'earth-sm': '0 2px 8px -1px rgba(0, 0, 0, 0.7)',
        'earth-md': '0 8px 24px -2px rgba(0, 0, 0, 0.8), 0 0 1px 1px rgba(255, 255, 255, 0.05)',
        'earth-lg': '0 16px 40px -4px rgba(0, 0, 0, 0.9)',
        // Neon glow shadows
        'glow-cyan': '0 0 20px -4px rgba(0, 240, 255, 0.4)',
        'glow-cyan-lg': '0 0 40px -6px rgba(0, 240, 255, 0.5)',
        'glow-violet': '0 0 20px -4px rgba(176, 38, 255, 0.4)',
        'glow-violet-lg': '0 0 40px -6px rgba(176, 38, 255, 0.5)',
        'glow-emerald': '0 0 20px -4px rgba(16, 185, 129, 0.35)',
        'glow-amber': '0 0 20px -4px rgba(245, 158, 11, 0.35)',
        'glow-rose': '0 0 20px -4px rgba(244, 63, 94, 0.35)',
        'neon-card': '0 8px 32px -4px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,240,255,0.08)',
        'neon-card-hover': '0 12px 40px -4px rgba(0,0,0,0.9), 0 0 0 1px rgba(0,240,255,0.2), 0 0 20px -4px rgba(0,240,255,0.2)',
      },
      backgroundImage: {
        'cyan-violet': 'linear-gradient(135deg, #00f0ff 0%, #b026ff 100%)',
        'cyan-violet-subtle': 'linear-gradient(135deg, rgba(0,240,255,0.15) 0%, rgba(176,38,255,0.15) 100%)',
        'neon-border': 'linear-gradient(135deg, #00f0ff, #b026ff)',
        'dot-grid': 'radial-gradient(circle, rgba(0,240,255,0.12) 1px, transparent 1px)',
      },
      backgroundSize: {
        'dot-grid': '24px 24px',
      },
    },
  },
  plugins: [],
}
