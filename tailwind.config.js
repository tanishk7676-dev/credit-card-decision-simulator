/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        slate: {
          50: '#FAFAF8',
          100: '#F2F1EE',
          200: '#E2E1DC',
          300: '#C6C5BE',
          400: '#77766F',
          500: '#686760',
          600: '#55544E',
          700: '#3F3E39',
          800: '#292824',
          900: '#151515',
        },
        brand: {
          50:  '#EFF7F3',
          100: '#DDEDE6',
          200: '#B9DACC',
          300: '#8FC2AE',
          400: '#5FA184',
          500: '#328265',
          600: '#176B52',
          700: '#145B46',
          800: '#104A39',
          900: '#0B362A',
        },
        success: {
          50:  '#EFF7F3',
          100: '#DDEDE6',
          200: '#B9DACC',
          500: '#328265',
          600: '#176B52',
          700: '#145B46',
        },
        warning: {
          50:  '#FFF3EF',
          100: '#FCE1D9',
          200: '#F4BFAF',
          500: '#E66A4F',
          600: '#D4482B',
          700: '#B83A22',
          800: '#922F1D',
          900: '#712519',
        },
        danger: {
          50:  '#FFF3EF',
          100: '#FCE1D9',
          200: '#F4BFAF',
          500: '#E66A4F',
          600: '#D4482B',
          700: '#B83A22',
        },
      },
    },
  },
  plugins: [],
}
