export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#faf6f1', card: '#fffdf9', line: '#e6dccd', sand: '#f1e6d6',
        ink: '#2a2622', muted: '#6b625a',
        brand: { DEFAULT: '#1f6f6a', dark: '#17524e', soft: '#dcecea' },
      },
      fontFamily: {
        display: ['"Young Serif"', 'Georgia', 'serif'],
        sans: ['Figtree', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
      },
    },
  },
}
