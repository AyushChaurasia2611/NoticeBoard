/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./styles/**/*.{js,ts,jsx,tsx,mdx,css}",
  ],
  theme: {
    extend: {
      colors: {
        indigo: {
          650: '#4f46e5', // Safe fallback mappings
          750: '#3730a3',
          850: '#1e1b4b',
        },
        slate: {
          750: '#1e293b',
          850: '#0f172a',
        },
      },
    },
  },
  plugins: [],
}
