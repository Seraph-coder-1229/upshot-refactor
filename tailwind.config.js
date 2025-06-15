// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    ".public/index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}", // Make sure this covers your files
  ],
  theme: {
    extend: {},
  },
  plugins: [
    // Add any plugins you might use, e.g.,
    // require('@tailwindcss/forms'),
  ],
};
