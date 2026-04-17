/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                serif: ['Fraunces', 'Georgia', 'serif'],
                body: ['Inter Tight', 'system-ui', 'sans-serif'],
                rounded: ['Baloo 2', 'system-ui', 'sans-serif'],
                display: ['Fraunces', 'Georgia', 'serif'],
            },
            colors: {
                ember: {
                    400: '#f07c4a',
                    500: '#e85d2f',
                    600: '#d14e1f',
                    700: '#b83f10',
                },
                brass: {
                    300: '#e0c9a0',
                    400: '#d4b896',
                    500: '#c9a96e',
                    600: '#a68956',
                },
                navy: {
                    500: '#475a7f',
                    600: '#3d5573',
                    700: '#324560',
                    800: '#263549',
                    900: '#1a2440',
                    950: '#0f1b35',
                },
                stone: {
                    50: '#f8f7f4',
                    100: '#ede8e0',
                    200: '#dfd5c8',
                    300: '#c4b5a0',
                    400: '#9d8b78',
                    500: '#6f6254',
                    600: '#3d3428',
                    700: '#2a251f',
                },
                parch: {
                    50: '#fffbf7',
                    100: '#faf5f0',
                    200: '#f2e9e0',
                    ink: '#3d3428',
                },
            },
            borderRadius: {
                '4xl': '40px',
                '5xl': '48px',
            },
            boxShadow: {
                'glow-ember': '0 8px 24px rgba(232, 93, 47, 0.28)',
                'glow-brass': '0 4px 16px rgba(201, 169, 110, 0.18)',
                'atlas-card': '0 4px 12px rgba(26, 36, 64, 0.10), 0 8px 24px rgba(26, 36, 64, 0.07)',
                'atlas-lg': '0 12px 32px rgba(26, 36, 64, 0.16)',
            },
        },
    },
    plugins: [],
}
