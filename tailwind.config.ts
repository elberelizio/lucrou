import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        verde: {
          DEFAULT: '#1B5E3B',
          med:     '#2E7D52',
          cl:      '#4CAF75',
        },
        mint: {
          DEFAULT: '#E8F5EE',
          2:       '#D0EBD9',
        },
        creme: {
          DEFAULT: '#FAF7F2',
          2:       '#F0EBE1',
        },
        laranja: {
          DEFAULT: '#D4622A',
          cl:      '#FCE8D5',
        },
        texto: {
          DEFAULT: '#1A1A1A',
          med:     '#4A4A4A',
          cl:      '#8A8A8A',
        },
      },
      fontFamily: {
        serif:  ['DM Serif Display', 'serif'],
        sans:   ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        card:  '0 2px 12px rgba(0,0,0,0.05)',
        hero:  '0 8px 24px rgba(0,0,0,0.15)',
        verde: '0 6px 20px rgba(27,94,59,0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
