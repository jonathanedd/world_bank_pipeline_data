/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#121212',
        darkCard: '#1E1E1E',
        textPearl: '#E0E0E0',
        accentOrange: '#FF6B35',
        accentGold: '#F7C548',
      }
    },
  },
  plugins: [],
}