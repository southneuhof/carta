const svelteModules = import.meta.glob('./*/SectionComponent.svelte');

const sectionComponents: Record<string, () => Promise<any>> = {};

for (const path in svelteModules) {
  const match = path.match(/\.\/([^/]+)\/SectionComponent\.svelte$/);
  if (match) {
    const sectionCode = match[1];
    sectionComponents[sectionCode] = svelteModules[path];
  }
}

export { sectionComponents };
