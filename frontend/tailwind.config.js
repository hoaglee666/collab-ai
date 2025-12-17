/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // <--- Make sure this is here!
  content: [
    './src/**/*.{html,ts}', // <--- This scans ALL folders in src
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
