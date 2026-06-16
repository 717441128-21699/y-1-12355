/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#C8102E',
          800: '#991B1B',
          900: '#7F1D1D',
          950: '#450A0A',
        },
        navy: {
          50: '#F0F5FA',
          100: '#E0EAF4',
          200: '#B8D0E8',
          300: '#8CB0D8',
          400: '#5C8CC4',
          500: '#3B6FA8',
          600: '#2D5A8A',
          700: '#003366',
          800: '#1A365D',
          900: '#0F2744',
          950: '#0A1929',
        },
        dark: {
          50: '#F8F8FC',
          100: '#E8E8F0',
          200: '#D0D0E0',
          300: '#A8A8C0',
          400: '#7878A0',
          500: '#5A5A80',
          600: '#4A4A6A',
          700: '#3A3A5A',
          800: '#2A2A4A',
          900: '#1A1A2E',
          950: '#0F0F1A',
        },
      },
      fontFamily: {
        sans: ['"Source Han Sans CN"', '"Noto Sans SC"', 'system-ui', 'sans-serif'],
        serif: ['"Source Han Serif CN"', '"Noto Serif SC"', 'Georgia', 'serif'],
      },
      borderRadius: {
        'sm': '2px',
        'DEFAULT': '4px',
        'md': '6px',
      },
      keyframes: {
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        'count-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'pulse-slow': 'pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'blink': 'blink 1s ease-in-out infinite',
        'count-up': 'count-up 0.5s ease-out',
      },
    },
  },
  plugins: [],
};
