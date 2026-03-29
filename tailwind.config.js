/** @type {import('tailwindcss').Config} */
export default {
    content: ["./src/**/*.{html,js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                fumi: {
                    50: "rgb(var(--color-fumi-50) / <alpha-value>)",
                    100: "rgb(var(--color-fumi-100) / <alpha-value>)",
                    200: "rgb(var(--color-fumi-200) / <alpha-value>)",
                    300: "rgb(var(--color-fumi-300) / <alpha-value>)",
                    400: "rgb(var(--color-fumi-400) / <alpha-value>)",
                    500: "rgb(var(--color-fumi-500) / <alpha-value>)",
                    600: "rgb(var(--color-fumi-600) / <alpha-value>)",
                    700: "rgb(var(--color-fumi-700) / <alpha-value>)",
                    800: "rgb(var(--color-fumi-800) / <alpha-value>)",
                    900: "rgb(var(--color-fumi-900) / <alpha-value>)",
                },
            },
            keyframes: {
                "fade-in": {
                    "0%": { opacity: "0", transform: "scale(0.98)" },
                    "100%": { opacity: "1", transform: "scale(1)" },
                },
                "slide-in": {
                    "0%": { opacity: "0", transform: "translateX(-4px)" },
                    "100%": { opacity: "1", transform: "translateX(0)" },
                },
            },
            animation: {
                "fade-in":
                    "fade-in 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
                "slide-in":
                    "slide-in 0.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
            },
        },
    },
    plugins: [require("tailwindcss-motion")],
};
