import { createLandingPageLoad } from '@southneuhof/landing-sveltekit-framework/server';
import sectionSchemas from '@client/section-schema';
import { getLocale } from '$lib/paraglide/runtime.js';
import { sectionLoaders } from '$lib/sections/section-loaders.server.js';
import { sectionResourceResolvers } from '$lib/sections/section-resource-resolvers.server.js';
import prisma from '$lib/utils/prisma.js';

// Deprecated: sectionLoaders is temporary compatibility wiring
// until all legacy per-section load.ts modules are migrated.
export const load = createLandingPageLoad({
  prisma,
  getLocale,
  sectionSchemas,
  sectionLoaders,
  sectionResourceResolvers,
});
