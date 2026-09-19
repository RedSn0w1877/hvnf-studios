import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        carbon: {
          50: '#1a1d23',
          100: '#151820',
          200: '#11141a',
          300: '#0d0f14',
          400: '#090b0f',
          500: '#05070c',
          600: '#030408',
          700: '#020305',
          800: '#010203',
          900: '#000000',
        },
        obsidian: {
          50: '#23272f',
          100: '#1e2229',
          200: '#181c23',
          300: '#14171d',
          400: '#0f1218',
          500: '#0a0d12',
          600: '#08090e',
          700: '#05060a',
          800: '#030406',
          900: '#010102',
        },
        signal: {
          green: '#00ff88',
          emerald: '#10b981',
          cyan: '#06b6d4',
        },
        border: {
          hairline: 'rgba(255, 255, 255, 0.08)',
          subtle: 'rgba(255, 255, 255, 0.12)',
          medium: 'rgba(255, 255, 255, 0.18)',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.8s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
