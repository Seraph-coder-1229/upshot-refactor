// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = { // or export default for ESM
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}", // Important: includes .vue and .ts
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}