/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // ✅ Ensures we can manually toggle dark mode
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
