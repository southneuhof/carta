import { defineSectionSchema } from '@southneuhof/landing-section-schema'

export default defineSectionSchema({
  code: 'job-catalog',
  info: {
    name: 'Job Catalog',
    description: 'Grid of active job postings',
  },
  editor: {
    group: 'Careers',
  },
  data: {
    content: {
      type: 'content',
      order: 1,
      fields: ['subtitle', 'title', 'description'] as const,
      editor: {
        label: 'Content',
      },
    },
    jobs: {
      type: 'resource',
      source: 'job',
      order: 2,
      many: true,
      fields: ['id', 'name', 'minimum_education', 'location', 'category'] as const,
      params: {
        strategy: 'activeList',
      },
    },
  },
})
