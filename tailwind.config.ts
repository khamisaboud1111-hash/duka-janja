import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Duka Janja brand palette — Zanzibar ocean + spice market warmth
        brand: {
          50:  '#edfafa',
          100: '#d5f5f5',
          200: '#aeecec',
          300: '#76dede',
          400: '#38c5c7',
          500: '#1da8ab',  // primary teal — Indian Ocean shallow water
          600: '#1a8a8d',
          700: '#186f72',
          800: '#185a5c',
          900: '#184c4e',
          950: '#082f30',
        },
        spice: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',  // spice orange — cloves/cinnamon market
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        sand: {
          50:  '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
        },
        ink: {
          50:  '#f0f4f4',
          100: '#dce6e6',
          200: '#b8cccc',
          300: '#8aabab',
          400: '#5c8a8a',
          500: '#3d6b6b',
          600: '#2e5252',
          700: '#1e3838',
          800: '#122424',
          900: '#091414',
          950: '#040a0a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.06)',
        'modal': '0 20px 60px rgba(0,0,0,0.2)',
      },
    },
  },
  plugins: [],
}

export default config
