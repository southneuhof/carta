import { fileURLToPath, URL } from 'node:url';

import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	resolve: {
		dedupe: ['svelte', '@sveltejs/kit'],
		alias: [
			{
				find: /^@southneuhof\/landing-sveltekit-framework$/,
				replacement: fileURLToPath(
					new URL('../../packages/landing-sveltekit-framework/src/index.ts', import.meta.url)
				)
			},
			{
				find: '@southneuhof/landing-sveltekit-framework/',
				replacement: fileURLToPath(
					new URL('../../packages/landing-sveltekit-framework/src/', import.meta.url)
				)
			},
			{
				find: /^@southneuhof\/utilities$/,
				replacement: fileURLToPath(new URL('../../packages/utilities/src/index.ts', import.meta.url))
			},
			{
				find: '@southneuhof/utilities/',
				replacement: fileURLToPath(new URL('../../packages/utilities/src/', import.meta.url))
			},
			{
				find: /^@southneuhof\/apostle$/,
				replacement: fileURLToPath(new URL('../../packages/apostle/src/index.ts', import.meta.url))
			},
			{
				find: '@southneuhof/apostle/',
				replacement: fileURLToPath(new URL('../../packages/apostle/src/', import.meta.url))
			},
			{
				find: /^@southneuhof\/landing-section-schema$/,
				replacement: fileURLToPath(
					new URL('../../packages/landing-section-schema/src/index.ts', import.meta.url)
				)
			},
			{
				find: '@southneuhof/landing-section-schema/',
				replacement: fileURLToPath(new URL('../../packages/landing-section-schema/src/', import.meta.url))
			}
		]
	},
	plugins: [
		tailwindcss(),
		sveltekit(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			strategy: ['cookie', 'baseLocale']
		})
	]
});
