import { defineSectionSchema } from '@southneuhof/landing-section-schema'

export default defineSectionSchema({
  code: 'navigator',
  info: {
    name: 'Navigator',
    description: 'Sticky section navigator for sections below this block',
  },
  editor: {
    group: 'Navigation',
  },
  render: {
    wrapper: {
      overflow: 'visible',
    },
  },
  data: {},
})
