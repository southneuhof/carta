import { readSectionSchemas } from '@southneuhof/landing-sveltekit-framework/server';
export { commonSectionMetaConfig } from './common-section-meta'

const sectionSchemas = readSectionSchemas(
  import.meta.glob('./sections/**/*.ts', {
    eager: true,
    import: 'default',
  }),
);

export default sectionSchemas;
