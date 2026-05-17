/** @type {import('tailwindcss').Config} */

const plugin = require('tailwindcss/plugin')
import flattenColorPalette from 'tailwindcss/lib/util/flattenColorPalette';

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  variants: {
    extend: {
      backgroundColor: ['before', 'before:hover', 'before:active'],
      opacity: ['before', 'before:hover', 'before:active'],
    },
  },
  theme: {
    fontFamily: ['Montserrat'],
    extend: {
      colors: {
        error: {
          DEFAULT: '#FF3B30',
          muted: '#FFD1CF'
        },
        surface: {
          // DEFAULT: '#FFF9F5',
          DEFAULT: '#FFFFFF',
          muted: '#EFE9E7'
        },
        primary: {
          DEFAULT: '#F68B1E',
          muted: '#FBD9AA'
        },
        secondary: {
          DEFAULT: '#ED1C25',
          muted: '#F9B0B0'
        },
        outline: {
          DEFAULT: '#656E95',
          variant: '#CDC9C9'
        },
        on: {
          surface: '#111F55',
          primary: '#FCF7E5'
        },
      }
    },
  },
  plugins: [
    // require('@tailwindcss/aspect-ratio'),
    require('tailwindcss-animate'),
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
    plugin(function({ matchUtilities, theme }) {
      matchUtilities(
        {
          'text-shadow': (value) => {
            return {
              'text-shadow': `0 0 1px ${value}, 0 0 1px ${value}, 0 0 1px ${value}`
            }
          },
        },
        {
          values: flattenColorPalette(theme('colors')),
          type: ['color'],
        }
      )
    })
  ],
}

