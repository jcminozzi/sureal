/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            colors: {
                background: '#0f172a',
                surface: '#1e293b',
                primary: '#8b5cf6',
                secondary: '#3b82f6',
                success: '#10b981',
                danger: '#ef4444',
            }
        },
    },
    plugins: [],
}
