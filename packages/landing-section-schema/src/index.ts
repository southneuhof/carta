import { readSectionSchemas } from '@southneuhof/landing-sveltekit-framework/server';

const sectionSchemas = readSectionSchemas(
  import.meta.glob('./sections/**/*.ts', {
    eager: true,
    import: 'default',
  }),
);

export default sectionSchemas;
