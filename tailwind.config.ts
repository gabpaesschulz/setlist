/**
 * Tailwind CSS v4 — configuration note
 *
 * This project uses Tailwind v4, where theme tokens and CSS variables are
 * defined directly in globals.css via @theme and @layer blocks.
 *
 * This file only serves as an explicit content-path declaration.
 * All color tokens, animations, and radius values live in:
 *   src/app/globals.css
 *
 * Docs: https://tailwindcss.com/docs/v4-beta
 */
import type { Config } from 'tailwindcss';

const config: Config = {
  // Dark mode via the `.dark` class (toggled by next-themes)
  darkMode: 'class',

  // Content paths scanned for class names
  content: [
    './src/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],

  theme: {
    extend: {
      /**
       * shadcn/ui color system — mirrors the CSS variables in globals.css.
       * In v4 these are resolved via @theme inline in the CSS file, but
       * listing them here provides IDE autocomplete in older tooling.
       */
      colors: {
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        border:      'hsl(var(--border))',
        input:       'hsl(var(--input))',
        ring:        'hsl(var(--ring))',
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },

      borderRadius: {
        sm:  'calc(var(--radius) - 4px)',
        md:  'calc(var(--radius) - 2px)',
        lg:  'var(--radius)',
        xl:  'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
      },

      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'slide-up': {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        'slide-in-from-bottom': {
          from: { transform: 'translateY(100%)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
      },

      animation: {
        'fade-in':             'fade-in 0.3s ease-out both',
        'slide-up':            'slide-up 0.4s ease-out both',
        'slide-in-from-bottom': 'slide-in-from-bottom 0.35s ease-out both',
      },
    },
  },

  plugins: [],
};

export default config;
