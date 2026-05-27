import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FAF9F5',
          100: '#F8F7F2',
          200: '#F5F6F0',
          300: '#EFEEE8',
          400: '#D6D3D0',
        },
        mocha: {
          DEFAULT: '#8E867E',
          dark: '#484745',
        },
        ink: {
          DEFAULT: '#1F1E1D',
          light: '#2D2B2A',
          muted: '#323130',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"PingFang SC"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
