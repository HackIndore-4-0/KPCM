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
        obsidian: '#05060A',
        panel: '#0D0F14',
        'panel-border': '#1A1F2C',
        'panel-hover': '#131722',
        cyan: {
          DEFAULT: '#00F0FF',
          glow: 'rgba(0, 240, 255, 0.15)',
          dim: 'rgba(0, 240, 255, 0.4)',
        },
        magenta: {
          DEFAULT: '#B026FF',
          glow: 'rgba(176, 38, 255, 0.15)',
        },
        emerald: {
          DEFAULT: '#10B981',
          glow: 'rgba(16, 185, 129, 0.15)',
        },
        amber: {
          DEFAULT: '#F59E0B',
          glow: 'rgba(245, 158, 11, 0.15)',
        },
        terracotta: {
          DEFAULT: '#EF4444',
          glow: 'rgba(239, 68, 68, 0.15)',
        },
        'off-white': '#E6E8EC',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'cyan-sm': '0 0 10px rgba(0, 240, 255, 0.2)',
        'cyan-md': '0 0 20px rgba(0, 240, 255, 0.25)',
        'magenta-sm': '0 0 10px rgba(176, 38, 255, 0.2)',
        'emerald-sm': '0 0 10px rgba(16, 185, 129, 0.2)',
        'red-sm': '0 0 10px rgba(239, 68, 68, 0.2)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
