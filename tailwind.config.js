// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}", // Make sure this covers your files
  ],
  theme: {
    extend: {
      // Add your theme customizations here
      // For example:
      // colors: {
      //   'brand-blue': '#007bff',
      // },
    },
  },
  plugins: [
    // Add any plugins you might use, e.g.,
    // require('@tailwindcss/forms'),
  ],
};
