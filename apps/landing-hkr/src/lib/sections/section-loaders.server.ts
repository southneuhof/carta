import type { SectionDataLoader } from '@southneuhof/landing-sveltekit-framework/types';

// Deprecated: this registry is kept temporarily for backward compatibility
// with legacy per-section load.ts modules. Prefer schema resource resolvers.
const dataModules = import.meta.glob('./*/load.ts');

const sectionLoaders: Record<string, SectionDataLoader> = {};

for (const path in dataModules) {
  const match = path.match(/\.\/([^/]+)\/load\.ts$/);
  if (!match) continue;
  const sectionCode = match[1];
  sectionLoaders[sectionCode] = async (section, context) => {
    const mod = await dataModules[path]() as { load: SectionDataLoader };
    return mod.load(section, context);
  };
}

export { sectionLoaders };
