import type { ModelConfig } from '@southneuhof/landing-sveltekit-framework/types';
import { parseSlug } from "$lib/utils/common";
import type { SectionType } from "@prisma/client";

export default {
  list: {
    allow: true,
    fields: ['id','name', 'code', 'description']
  },

  create: {
    allow: true,
    fields: ['name', 'code', 'description'],
    lifecycle: {
      pre: async (body) => {
        return {
          ...body,
          code: parseSlug(body.name)
        }
      }
    }
  }
} as ModelConfig<SectionType>