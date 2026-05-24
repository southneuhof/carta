import type { ModelConfig } from '@southneuhof/landing-sveltekit-framework/types';
import type { Gallery, Prisma } from "@prisma/client";

export default {
  detail: {
    allow: true,
    fieldsForeign: {
      contents: {
        fields: ['id', 'media', 'title', 'subtitle', 'description', 'order', 'section_id', 'gallery_id']
      }
    }
  }
} as ModelConfig<Prisma.GalleryGetPayload<{include: {contents: true}}>>