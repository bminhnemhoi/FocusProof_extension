/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class', // we force dark mode by adding `dark` class on <html>
  theme: {
    extend: {
      colors: {
        // FocusProof brand palette (dark mode first)
        bg: {
          DEFAULT: '#0A0E14', // page background
          surface: '#0F141B', // cards / sections
          elevated: '#161D27', // hover / elevated cards
          border: '#1F2A37',
        },
        brand: {
          50: '#EEF6FF',
          100: '#D9EBFF',
          400: '#5BA8FF',
          500: '#2F80FF', // primary CTA
          600: '#1F6FE5',
          700: '#1A5BBF',
        },
        accent: {
          green: '#22C55E',
          amber: '#F59E0B',
          red: '#EF4444',
          purple: '#A855F7',
          momo: '#A50064', // Momo brand pink
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(47,128,255,0.35), 0 8px 32px -8px rgba(47,128,255,0.45)',
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.6)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.25s ease-out',
        scaleIn: 'scaleIn 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
