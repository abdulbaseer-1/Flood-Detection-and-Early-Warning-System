/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0f172a',
          teal: '#0d9488',
          grey: '#f3f4f6',
          dark: '#1e293b'
        }
      }
    },
  },
  plugins: [],
}
