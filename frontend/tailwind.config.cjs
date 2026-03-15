/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        amber: { 400: '#fbbf24' },
        slate: { 900: '#0f172a', 950: '#020617' }
      }
    },
  },
  plugins: [],
}