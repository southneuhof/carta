import type { ModelConfig } from '@southneuhof/landing-sveltekit-framework/types';
import { parseCode } from "@southneuhof/utilities/string";
import type { Prisma } from "@prisma/client";

export default {
  view: {
    fields: ["name", "code", "data"],
  },
  create: {
    allow: true,
    permission: 'update-collection',
    fields: ["name", "code", "data"],
    validation: {
      name: [
        {
          validator: (value: string) => value.length > 0,
          message: "Name is required",
        },
      ],
    },
    lifecycle: {
      pre: async (body) => {
        body.code = parseCode(body.name);
        return body;
      },
    },
  },
  update: {
    allow: true,
    permission: 'update-collection',
    by: ["code"],
    fields: ["name", "code", "data"],
  },
  list: {
    allow: true,
    permission: 'view-collection',
    searchableBy: ["name", "code"],
    filterableBy: ["name", "code"],
    orderBy: { name: "asc" },
  },
  detail: {
    by: ['code'],
    allow: true,
    permission: 'view-collection',
    lifecycle: {
      post: async (data, total) => {
        return data.data
      },
    }
  },
  delete: {
    allow: true,
    permission: 'update-collection',
  },
} as ModelConfig<Prisma.CollectionGetPayload<{}>>;
