/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0b1326',
          dim: '#0b1326',
          bright: '#31394d',
          container: '#131b30',
          'container-low': '#0f1728',
          'container-high': '#1a2340',
          'container-highest': '#232d47',
          'container-lowest': '#060e1e',
        },
        primary: {
          DEFAULT: '#a5b4fc',
          container: '#6366f1',
          fixed: '#e1e0ff',
          dim: '#a5b4fc',
          on: '#1000a9',
          'on-container': '#0d0096',
        },
        secondary: {
          DEFAULT: '#34d399',
          container: '#059669',
          fixed: '#6ffbbe',
          on: '#003824',
          'on-container': '#00311f',
        },
        tertiary: {
          DEFAULT: '#bdc2ff',
          container: '#7c87f3',
        },
        outline: {
          DEFAULT: '#6b7499',
          variant: '#2a3352',
        },
        'on-surface': '#e8eafc',
        'on-surface-variant': '#9ba3c2',
        'on-surface-dim': '#6b7499',
        'inverse-surface': '#e8eafc',
        'inverse-primary': '#494bd6',
        error: '#fca5a5',
        'error-container': '#93000a',
        warning: '#fbbf24',
        indigo: {
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        emerald: {
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        pink: {
          400: '#f472b6',
          500: '#ec4899',
        },
        amber: {
          400: '#fbbf24',
          500: '#f59e0b',
        },
        purple: {
          400: '#c084fc',
          500: '#a855f7',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      fontSize: {
        'xs':   ['0.75rem',  { lineHeight: '1.5',  letterSpacing: '0em' }],
        'sm':   ['0.8125rem', { lineHeight: '1.5', letterSpacing: '-0.006em' }],
        'base': ['0.9375rem', { lineHeight: '1.65', letterSpacing: '-0.011em' }],
        'lg':   ['1.0625rem', { lineHeight: '1.6', letterSpacing: '-0.014em' }],
        'xl':   ['1.25rem',  { lineHeight: '1.5',  letterSpacing: '-0.017em' }],
        '2xl':  ['1.5rem',   { lineHeight: '1.35', letterSpacing: '-0.022em' }],
        '3xl':  ['1.875rem', { lineHeight: '1.25', letterSpacing: '-0.025em' }],
        '4xl':  ['2.25rem',  { lineHeight: '1.2',  letterSpacing: '-0.028em' }],
        '5xl':  ['3rem',     { lineHeight: '1.1',  letterSpacing: '-0.032em' }],
        '6xl':  ['3.75rem',  { lineHeight: '1.05', letterSpacing: '-0.035em' }],
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        'glow-indigo': '0 0 24px rgba(99, 102, 241, 0.25), 0 4px 16px rgba(99, 102, 241, 0.15)',
        'glow-emerald': '0 0 24px rgba(16, 185, 129, 0.2), 0 4px 16px rgba(16, 185, 129, 0.1)',
        'ambient': '0px 24px 48px rgba(6, 14, 32, 0.1)',
        'card': '0 4px 24px rgba(6, 14, 32, 0.15)',
        'card-hover': '0 16px 48px rgba(6, 14, 32, 0.25)',
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      },
      backgroundImage: {
        'gradient-indigo': 'linear-gradient(135deg, #6366f1, #818cf8)',
        'gradient-emerald': 'linear-gradient(135deg, #10b981, #34d399)',
        'gradient-mesh': 'radial-gradient(ellipse at 20% 50%, rgba(99, 102, 241, 0.07) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(16, 185, 129, 0.04) 0%, transparent 50%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(99, 102, 241, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)' },
        },
      },
    },
  },
  plugins: [],
}
