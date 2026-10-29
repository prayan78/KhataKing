/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kirana: {
          darkest: '#01261d',
          dark: '#023c2e',
          DEFAULT: '#034b39',
          light: '#0b5f49',
          mint: '#e6f4ef',
          gold: '#d4af37',
          goldLight: '#f9e8a2',
          goldDark: '#a37c15',
          amber: '#d97706',
          danger: '#dc2626',
          dangerLight: '#fee2e2',
          success: '#16a34a',
          successLight: '#dcfce7',
          surface: '#f8fafc',
          card: '#ffffff',
          textMain: '#0f172a',
          textMuted: '#475569'
        }
      },
      fontSize: {
        // Generous, legible fonts designed for 60-70 yr old Kirana shopkeepers
        'kirana-xs': ['15px', '22px'],
        'kirana-sm': ['17px', '24px'],
        'kirana-base': ['19px', '28px'],
        'kirana-lg': ['22px', '30px'],
        'kirana-xl': ['26px', '34px'],
        'kirana-2xl': ['32px', '40px'],
        'kirana-3xl': ['40px', '48px'],
      },
      minHeight: {
        'touch': '56px',
      },
      minWidth: {
        'touch': '56px',
      }
    },
  },
  plugins: [],
}

