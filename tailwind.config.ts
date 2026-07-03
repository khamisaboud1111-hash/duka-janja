import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ADD THIS COLORS SECTION
      colors: {
        ink: {
          50: '#f8fafc',
          100: '#f1f5f9',
          300: '#cbd5e1',
          400: '#94a3b8',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a', // The 900 color your CSS is looking for
          950: '#020617',
        },
        brand: {
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        // Add other colors here if you see errors for them
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.06)',
        'modal': '0 20px 60px rgba(0,0,0,0.2)',
        'glow-brand': '0 0 1px rgba(29,168,171,0.4), 0 8px 24px rgba(29,168,171,0.25)',
        'glow-spice': '0 8px 24px rgba(249,115,22,0.35)',
        'glass': '0 8px 32px rgba(0,0,0,0.35)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite linear',
        'fade-up': 'fade-up 0.35s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
