import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['selector', '[data-theme="dark"]'],

  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],

  theme: {
    extend: {
      colors: {
        /* Surfaces */
        page:             'var(--bg-page)',
        surface:          'var(--bg-surface)',
        'surface-raised': 'var(--bg-surface-raised)',
        'surface-glass':  'var(--bg-surface-glass)',

        /* Text */
        primary:   'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted:     'var(--text-muted)',

        /* Borders */
        border:          'var(--border)',
        'border-strong': 'var(--border-strong)',

        /* Brand / Theme Accents */
        magenta: {
          DEFAULT: 'var(--accent-primary)',
          hover:   'var(--accent-primary-hover)',
          glow:    'var(--accent-primary-glow)',
        },
        teal: {
          DEFAULT: 'var(--accent-secondary)',
          hover:   'var(--accent-secondary-hover)',
        },

        /* Gold / Orange accents */
        gold: {
          DEFAULT: 'var(--accent-gold)',
          hover:   'var(--accent-gold-hover)',
          muted:   'var(--accent-gold-muted)',
        },
        brand: {
          DEFAULT: 'var(--accent-orange)',
          hover:   'var(--accent-orange-hover)',
        },

        /* Semantic */
        danger:  'var(--color-danger)',
        warning: 'var(--color-warning)',
        success: 'var(--color-success)',
        info:    'var(--color-info)',

        /* Checkerboard tiles */
        'checker-1': 'var(--checker-tile-1)',
        'checker-2': 'var(--checker-tile-2)',
      },

      fontFamily: {
        display: ['var(--font-display)'],
        body:    ['var(--font-body)'],
        mono:    ['var(--font-mono)'],
      },

      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },

      boxShadow: {
        focus:    'var(--shadow-focus)',
        sm:       'var(--shadow-sm)',
        md:       'var(--shadow-md)',
        lg:       'var(--shadow-lg)',
        glow:     'var(--shadow-glow)',
        'glow-sm':'var(--shadow-glow-sm)',
      },

      backgroundImage: {
        'gradient-hero':  'var(--gradient-hero)',
        'gradient-brand': 'var(--gradient-brand)',
      },

      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 10px var(--accent-primary-glow)' },
          '50%':       { boxShadow: '0 0 30px var(--accent-primary-glow)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(100%)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        'pulse-glow':    'pulse-glow 2.5s ease-in-out infinite',
        'fade-up':       'fade-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-in':      'scale-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-up':      'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
        shimmer:         'shimmer 2s linear infinite',
        float:           'float 4s ease-in-out infinite',
      },
    },
  },

  plugins: [],
};

export default config;
