/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin')

module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts}', '../../packages/is-vue-framework/src/**/*.{vue,js,ts,tsx}'],
  darkMode: ['class'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist Sans'],
      },
      // fontSize: {
      //   sm: '12px',
      //   base: '14px',
      //   lg: '16px',
      //   xl: '18px',
      // },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
      },
      colors: {
        muted: 'rgb(var(--md-sys-color-on-surface) / 38%)',
        scrim: 'rgb(var(--md-sys-color-scrim))',
        primary: {
          DEFAULT: 'rgb(var(--md-sys-color-primary) / <alpha-value>)',
          container: 'rgb(var(--md-sys-color-primary-container) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--md-sys-color-secondary) / <alpha-value>)',
          container: 'rgb(var(--md-sys-color-secondary-container) / <alpha-value>)',
        },
        tertiary: {
          DEFAULT: 'rgb(var(--md-sys-color-tertiary) / <alpha-value>)',
          container: 'rgb(var(--md-sys-color-tertiary-container) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'rgb(var(--md-sys-color-warning) / <alpha-value>)',
          container: 'rgb(var(--md-sys-color-warning-container) / <alpha-value>)',
        },
        info: {
          DEFAULT: 'rgb(var(--md-sys-color-info) / <alpha-value>)',
          container: 'rgb(var(--md-sys-color-info-container) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'rgb(var(--md-sys-color-success) / <alpha-value>)',
          container: 'rgb(var(--md-sys-color-success-container) / <alpha-value>)',
        },
        error: {
          DEFAULT: 'rgb(var(--md-sys-color-error) / <alpha-value>)',
          container: 'rgb(var(--md-sys-color-error-container) / <alpha-value>)',
        },
        background: 'rgb(var(--md-sys-color-background) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--md-sys-color-surface) / <alpha-value>)',
          variant: 'rgb(var(--md-sys-color-surface-variant) / <alpha-value>)',
          container: {
            lowest: 'rgb(var(--md-sys-color-surface-container-lowest) / <alpha-value>)',
            low: 'rgb(var(--md-sys-color-surface-container-low) / <alpha-value>)',
            DEFAULT: 'rgb(var(--md-sys-color-surface-container) / <alpha-value>)',
            high: 'rgb(var(--md-sys-color-surface-container-high) / <alpha-value>)',
            highest: 'rgb(var(--md-sys-color-surface-container-highest) / <alpha-value>)',
          },
        },
        outline: {
          DEFAULT: 'rgb(var(--md-sys-color-outline) / <alpha-value>)',
          variant: 'rgb(var(--md-sys-color-outline-variant) / <alpha-value>)',
        },
        inverse: {
          surface: 'rgb(var(--md-sys-color-inverse-surface) / <alpha-value>)',
          on: {
            surface: 'rgb(var(--md-sys-color-inverse-on-surface) / <alpha-value>)',
          },
          primary: 'rgb(var(--md-sys-color-inverse-primary) / <alpha-value>)',
        },
        on: {
          primary: {
            DEFAULT: 'rgb(var(--md-sys-color-on-primary) / <alpha-value>)',
            container: 'rgb(var(--md-sys-color-on-primary-container) / <alpha-value>)',
          },
          secondary: {
            DEFAULT: 'rgb(var(--md-sys-color-on-secondary) / <alpha-value>)',
            container: 'rgb(var(--md-sys-color-on-secondary-container) / <alpha-value>)',
          },
          tertiary: {
            DEFAULT: 'rgb(var(--md-sys-color-on-tertiary) / <alpha-value>)',
            container: 'rgb(var(--md-sys-color-on-tertiary-container) / <alpha-value>)',
          },
          warning: {
            DEFAULT: 'rgb(var(--md-sys-color-on-warning) / <alpha-value>)',
            container: 'rgb(var(--md-sys-color-on-warning-container) / <alpha-value>)',
          },
          info: {
            DEFAULT: 'rgb(var(--md-sys-color-on-info) / <alpha-value>)',
            container: 'rgb(var(--md-sys-color-on-info-container) / <alpha-value>)',
          },
          success: {
            DEFAULT: 'rgb(var(--md-sys-color-on-success) / <alpha-value>)',
            container: 'rgb(var(--md-sys-color-on-success-container) / <alpha-value>)',
          },
          error: {
            DEFAULT: 'rgb(var(--md-sys-color-on-error) / <alpha-value>)',
            container: 'rgb(var(--md-sys-color-on-error-container) / <alpha-value>)',
          },
          background: 'rgb(var(--md-sys-color-on-background) / <alpha-value>)',
          surface: {
            DEFAULT: 'rgb(var(--md-sys-color-on-surface) / <alpha-value>)',
            variant: 'rgb(var(--md-sys-color-on-surface-variant) / <alpha-value>)',
          },
        },
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    plugin(function ({ addBase }) {
      addBase({
        html: { fontSize: '14px' },
      })
    }),
    plugin(function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          'grid-dynamic': (value) => {
            return {
              gridTemplateColumns: `repeat(auto-fit, minmax(${value}, 1fr))`,
            }
          },
        },
        { values: theme('spacing') }
      )
    }),
  ],
}
