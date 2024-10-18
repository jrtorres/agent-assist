/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      flex: {
        3: "0 0 33.333333%",
        6: "0 0 66.666667%",
      },
    },
  },
  plugins: [],
};
