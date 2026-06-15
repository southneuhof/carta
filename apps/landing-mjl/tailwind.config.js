/** @type {import('tailwindcss').Config} */

const plugin = require('tailwindcss/plugin')
import flattenColorPalette from 'tailwindcss/lib/util/flattenColorPalette';
import { landingThemeColors } from './theme/colors.js'

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
        ...landingThemeColors,
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
