// Dynamically import all data.ts files in subfolders (section code = folder name)
const dataModules = import.meta.glob('./*/load.ts');
// Updated glob pattern to match .svelte files
const svelteModules = import.meta.glob('./*/SectionComponent.svelte');

type SectionDataLoader = (section: Record<string, any>, url?: any) => Promise<any>;

const sectionLoaders: Record<string, SectionDataLoader> = {};
const sectionComponents: Record<string, () => Promise<any>> = {};

for (const path in dataModules) {
  const match = path.match(/\.\/([^/]+)\/load\.ts$/);
  if (match) {
    const sectionCode = match[1];
    sectionLoaders[sectionCode] = async (section) => {
      const mod = await dataModules[path]() as { load: SectionDataLoader };
      return mod.load(section);
    };
  }
}

for (const path in svelteModules) {
  const match = path.match(/\.\/([^/]+)\/SectionComponent\.svelte$/);
  if (match) {
    const sectionCode = match[1];
    sectionComponents[sectionCode] = svelteModules[path];
  }
}

export { sectionLoaders, sectionComponents };
