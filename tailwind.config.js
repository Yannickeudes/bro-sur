export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#faf6f1', card: '#fffdf9', line: '#e8ddd0', sand: '#f3ebe1',
        ink: '#2c2521', muted: '#6f6259',
        brand: { DEFAULT: '#b25938', dark: '#96452c', soft: '#f5e6da' },
      },
      fontFamily: {
        display: ['"Young Serif"', 'Georgia', 'serif'],
        sans: ['Figtree', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
      },
    },
  },
}
