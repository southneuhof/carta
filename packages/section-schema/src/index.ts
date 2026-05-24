import { readSectionSchemas } from '@southneuhof/landing-section-schema'

const sectionSchemas = readSectionSchemas(
  import.meta.glob('./sections/**/*.ts', {
    eager: true,
    import: 'default',
  }),
)

export default sectionSchemas
