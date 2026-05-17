import type { ModelConfig } from '@southneuhof/landing-sveltekit-framework/types';
import prisma from "$lib/utils/prisma";
import type { Content } from "@prisma/client";
import { copySectionGroupContent } from '$lib/utils/section';
import { ensureDraftState } from '$lib/utils/page';

export default {
  // types: {
  //   media: {
  //     type: 'file'
  //   }
  // },
  detail: {
    allow: true,
    by: ['id']
  },
  list: {
    allow: true,
    filterableBy: ['gallery_id'],
    orderBy: {
      order: 'asc'
    },
  },
  create: {
    allow: true,
    fields: ['media', 'title', 'subtitle', 'description', 'label', 'content', 'blurb', 'media_type', 'attachment', 'status', 'order', 'gallery_id', 'url', 'url_text', 'url_type', 'amount', 'collection', 'meta'],
    lifecycle: {
      pre: async (body) => {
        const { page_translation_id, ...rest } = body;
        // Handle draft creation
        if (page_translation_id) {
          const { idMap } = await ensureDraftState(page_translation_id);
          if (idMap && body.gallery_id) {
            const newGalleryId = idMap.get(body.gallery_id);
            if (newGalleryId) {
              body.gallery_id = newGalleryId;
            }
          }
        }

        // Handle ordering
        const maxOrderItem = await prisma.content.findFirst({
          where: {
            gallery_id: body.gallery_id || null
          },
          orderBy: { order: 'desc' },
          select: { order: true }
        });

        body.order = (maxOrderItem?.order ?? 0) + 1;
        return body;
      }
    }
  },
  update: {
    allow: true,
    by: ['id'],
    fields: ['media', 'title', 'subtitle', 'description', 'label', 'content', 'blurb', 'media_type', 'attachment', 'status', 'order', 'url', 'url_text', 'url_type', 'amount', 'collection', 'meta'],
    lifecycle: {
      pre: async (body) => {
        const { id, page_translation_id, ...rest } = body;
        if (!page_translation_id) return body;

        const { idMap } = await ensureDraftState(page_translation_id);

        // If a new draft was created, we need to use the new ID for the content.
        if (idMap) {
          const newContentId = idMap.get(id);
          if (newContentId) {
            return { id: newContentId, page_translation_id, ...rest };
          }
        }

        return body;
      }
    }
  },
  reorder: {
    allow: true,
    axis: ['gallery_id'],
    lifecycle: {
      pre: async (body) => {
        const { id, page_translation_id, ...rest } = body;
        if (!page_translation_id) return body;

        const { idMap } = await ensureDraftState(page_translation_id);

        // If a new draft was created, we need to use the new ID for the content.
        if (idMap) {
          const newContentId = idMap.get(id);
          if (newContentId) {
            return { id: newContentId, page_translation_id, ...rest };
          }
        }

        return body;
      }
    }
  },
  delete: {
    allow: true,
    by: ['id'],
    lifecycle: {
      pre: async (body) => {
        const { id, page_translation_id, ...rest } = body;
        if (!page_translation_id) return body;

        const { idMap } = await ensureDraftState(page_translation_id);

        // If a new draft was created, we need to use the new ID for the content.
        if (idMap) {
          const newContentId = idMap.get(id);
          if (newContentId) {
            return { id: newContentId, page_translation_id, ...rest };
          }
        }

        return body;
      }
    }
  }
} as ModelConfig<Content>