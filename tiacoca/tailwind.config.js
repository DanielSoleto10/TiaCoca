/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class', // Activar modo oscuro basado en clase CSS
    theme: {
      extend: {
        colors: {
          // Colores principales para modo claro
          'primary': {
            50: '#f0fdf4',
            100: '#dcfce7',
            200: '#bbf7d0',
            300: '#86efac',
            400: '#4ade80',
            500: '#22c55e',  // Verde principal
            600: '#16a34a',
            700: '#15803d',  // Verde oscuro para hover
            800: '#166534',
            900: '#14532d',
          },
          // Colores para modo oscuro
          'dark': {
            100: '#1e293b', // Dark sidebar
            200: '#0f172a', // Dark background
            300: '#334155', // Dark lighter
            400: '#475569', // Dark hover
          }
        },
        transitionProperty: {
          'width': 'width',
          'height': 'height',
          'spacing': 'margin, padding',
        },
      },
    },
    plugins: [],
  }