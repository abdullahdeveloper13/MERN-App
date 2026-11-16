/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dbe7ff",
          200: "#bed3ff",
          300: "#92b5ff",
          400: "#5f8dff",
          500: "#3b66f5",
          600: "#2547e0",
          700: "#1d38bd",
          800: "#1d3196",
          900: "#1d2f77"
        },
        ink: {
          950: "#0b1220",
          900: "#131c2e",
          700: "#334158",
          500: "#5a6a83",
          300: "#94a3b8"
        }
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"]
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -12px rgba(15, 23, 42, 0.12)",
        pop: "0 12px 40px -12px rgba(15, 23, 42, 0.25)"
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem"
      }
    }
  },
  plugins: []
};
