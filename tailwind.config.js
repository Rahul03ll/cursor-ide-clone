/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#3B82F6',
        'secondary': '#10B981',
        'accent': '#F59E0B',
        'background': '#0F172A',
        'surface': '#1E293B',
        'text': '#F1F5F9',
        'muted': '#94A3B8',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
