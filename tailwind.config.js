/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'spotify': '#1DB954',
        'apple': '#FA233B',
        'dark': {
          100: '#2A2A2A',
          200: '#1E1E1E',
          300: '#181818',
          400: '#121212',
        },
        'light': {
          100: '#FFFFFF',
          200: '#F8F8F8',
          300: '#F4F4F4',
          400: '#EBEBEB',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      }
    },
  },
  plugins: [],
};