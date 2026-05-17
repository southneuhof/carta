import { createLandingPageLoad } from '@southneuhof/landing-sveltekit-framework/server';
import { getLocale } from '$lib/paraglide/runtime.js';
import prisma from '$lib/utils/prisma.js';
import { sectionLoaders } from '$lib/sections/index.js';

export const load = createLandingPageLoad({
  prisma,
  getLocale,
  sectionLoaders,
});
