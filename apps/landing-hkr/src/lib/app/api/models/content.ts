import type { ModelConfig } from '@southneuhof/landing-sveltekit-framework/types';
import { normalizeFileUploadValue } from '@southneuhof/landing-sveltekit-framework/server/files';
import prisma from "$lib/utils/prisma";
import type { Content } from "@prisma/client";
import { ensureDraftState } from '$lib/utils/page';
import { exception } from '$lib/utils/response';

function normalizeContentFileFields(body: Record<string, any>): Record<string, any> {
  const next = { ...body };

  for (const field of ['media', 'attachment']) {
    if (!(field in next)) continue;
    const normalized = normalizeFileUploadValue(next[field]);
    if (typeof normalized === 'string') {
      next[field] = normalized;
    }
  }

  return next;
}

const ensureDraftPreHook = async (body: Record<string, any>, options?: { requireId?: boolean }) => {
  const normalizedBody = normalizeContentFileFields(body);
  const { id, page_translation_id, ...rest } = normalizedBody;
  const requireId = options?.requireId ?? false;

  if (requireId && !id) {
    throw exception('Missing content id', 400);
  }

  if (!page_translation_id) {
    return normalizedBody;
  }

  const { idMap } = await ensureDraftState(page_translation_id);
  if (idMap && id) {
    const newContentId = idMap.get(id);
    if (newContentId) {
      return { id: newContentId, ...rest };
    }
  }

  // `page_translation_id` is only used to ensure draft state; never pass it to prisma.
  return { ...(id ? { id } : {}), ...rest };
};

export default {
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
        const normalizedBody = normalizeContentFileFields(body);
        const { page_translation_id } = normalizedBody;

        if (page_translation_id) {
          const { idMap } = await ensureDraftState(page_translation_id);
          if (idMap && normalizedBody.gallery_id) {
            const newGalleryId = idMap.get(normalizedBody.gallery_id);
            if (newGalleryId) {
              normalizedBody.gallery_id = newGalleryId;
            }
          }
        }

        const maxOrderItem = await prisma.content.findFirst({
          where: {
            gallery_id: normalizedBody.gallery_id || null
          },
          orderBy: { order: 'desc' },
          select: { order: true }
        });

        normalizedBody.order = (maxOrderItem?.order ?? 0) + 1;
        return page_translation_id ? await ensureDraftPreHook(normalizedBody) : normalizedBody;
      }
    }
  },
  update: {
    allow: true,
    by: ['id'],
    fields: ['media', 'title', 'subtitle', 'description', 'label', 'content', 'blurb', 'media_type', 'attachment', 'status', 'order', 'url', 'url_text', 'url_type', 'amount', 'collection', 'meta'],
    lifecycle: {
      pre: async (body) => await ensureDraftPreHook(body, { requireId: true })
    }
  },
  reorder: {
    allow: true,
    axis: ['gallery_id'],
    lifecycle: {
      pre: async (body) => await ensureDraftPreHook(body, { requireId: true })
    }
  },
  delete: {
    allow: true,
    by: ['id'],
    lifecycle: {
      pre: async (body) => await ensureDraftPreHook(body, { requireId: true })
    }
  }
} as ModelConfig<Content>
