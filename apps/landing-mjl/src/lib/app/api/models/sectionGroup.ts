import type { ModelConfig } from '@southneuhof/landing-sveltekit-framework/types';
import type { Prisma, SectionGroup } from "@prisma/client";

export default {
  detail: {
    allow: true,
    by: ['id'],
    fields: ['id'],
    fieldsForeign: {
      sections: {
        fields: ['id', 'order', 'name', 'section_type_code']
      }
    },
    lifecycle: {
      post: async (data) => {
        return {
          ...data,
          sections: data.sections.sort((a: Record<string, any>, b: Record<string, any>) => a.order - b.order)
        }
      }
    }
  }
} as ModelConfig<Prisma.SectionGroupGetPayload<{include: {sections: true}}>>