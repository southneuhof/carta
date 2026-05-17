import { createLandingPageLoad } from '@southneuhof/landing-sveltekit-framework/server';
import sectionSchemas from '@southneuhof/landing-section-schema';
import { getLocale } from '$lib/paraglide/runtime.js';
import prisma from '$lib/utils/prisma.js';

export const load = createLandingPageLoad({
  prisma,
  getLocale,
  sectionSchemas,
});
