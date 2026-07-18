/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#faf6f0",
        ink: "#161513",
        accent: {
          light: "#d7f5e0",
          DEFAULT: "#1c8a4b",
          dark: "#0f6b38",
        },
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
