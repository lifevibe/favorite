/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    "./index.html",
    "./*.tsx",
    "./*.ts",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
        dark: '#0f172a',
        card: '#1e293b',
      }
    }
  },
  plugins: [],
}