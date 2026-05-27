export const publishablePackages = [
  {
    name: '@southneuhof/is-data-model',
    root: 'packages/is-data-model',
    repo: 'https://github.com/southneuhof/is-data-model.git',
    branch: 'main',
    tempBranch: 'sync/is-data-model',
    requiredFiles: [
      'dist/index.js',
      'dist/index.js.map',
      'dist/index.d.ts',
      'dist/index.d.ts.map',
      'src/index.ts',
    ],
  },
  {
    name: '@southneuhof/apostle',
    root: 'packages/apostle',
    repo: 'https://github.com/southneuhof/apostle.git',
    branch: 'main',
    tempBranch: 'sync/apostle',
    requiredFiles: [
      'dist/index.js',
      'dist/index.js.map',
      'dist/index.d.ts',
      'dist/index.d.ts.map',
      'src/index.ts',
    ],
  },
  {
    name: '@southneuhof/utilities',
    root: 'packages/utilities',
    repo: 'https://github.com/southneuhof/utilities.git',
    branch: 'main',
    tempBranch: 'sync/utilities',
    requiredFiles: [
      'dist/index.js',
      'dist/index.js.map',
      'dist/index.d.ts',
      'dist/index.d.ts.map',
      'src/index.ts',
    ],
  },
  {
    name: '@southneuhof/is-vue-framework',
    root: 'packages/is-vue-framework',
    repo: 'https://github.com/southneuhof/is-vue-framework.git',
    branch: 'main',
    tempBranch: 'sync/is-vue-framework',
    requiredFiles: [
      'dist/index.js',
      'dist/index.js.map',
      'dist/index.d.ts',
      'dist/index.d.ts.map',
      'dist/components/base/Button.vue',
      'dist/components/composites/CRUDComposite.vue',
      'dist/styles/framework.css',
      'src/index.ts',
      'src/components/composites/CRUDComposite.vue',
    ],
  },
  {
    name: '@southneuhof/landing-section-schema',
    root: 'packages/landing-section-schema',
    repo: 'https://github.com/southneuhof/landing-section-schema.git',
    branch: 'main',
    tempBranch: 'sync/landing-section-schema',
    verifyNodeEsmImports: true,
    requiredFiles: [
      'dist/index.js',
      'dist/index.js.map',
      'dist/index.d.ts',
      'dist/index.d.ts.map',
      'dist/defineSectionSchema.js',
      'dist/common-section-meta.js',
      'src/index.ts',
    ],
  },
  {
    name: '@southneuhof/landing-sveltekit-framework',
    root: 'packages/landing-sveltekit-framework',
    repo: 'https://github.com/southneuhof/landing-sveltekit-framework.git',
    branch: 'main',
    tempBranch: 'sync/landing-sveltekit-framework',
    requiredFiles: [
      'dist/index.js',
      'dist/index.d.ts',
      'dist/components/LandingPage.svelte',
      'dist/components/SectionRenderer.svelte',
      'dist/components/SectionWrapper.svelte',
      'dist/components/IntersectionObserver.svelte',
      'dist/styles/framework.css',
      'src/index.ts',
      'src/components/LandingPage.svelte',
    ],
  },
]

export const publishablePackageNames = publishablePackages.map((pkg) => pkg.name)
export const publishablePackageByName = new Map(publishablePackages.map((pkg) => [pkg.name, pkg]))

export function packageFilterArgs() {
  return publishablePackageNames.flatMap((name) => ['--filter', name])
}
