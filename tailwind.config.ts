import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#1E2A47',   // Bleu foncé principal
          DEFAULT: '#2C4270',
          light: '#4A6491',
        },
        surface: {
          light: '#F5F6F8',  // Gris clair (fonds)
          white: '#FFFFFF',  // Blanc (conteneurs)
        },
        success: '#22A559',  // Vert (rentable)
        warning: '#F0A93E',  // Orange (équilibre)
        danger: '#E5484D',   // Rouge (perte)
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
