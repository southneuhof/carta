import type { ModelConfig } from '@southneuhof/landing-sveltekit-framework/types';
import type { Prisma } from "@prisma/client";

export default{
  allow: true,
  fields: ['id', 'name'],
  
  create: {
    fields: ['name'],
    validation: {
      name: [
        {
          validator: (value) => value && value.length > 0,
          message: 'Role group name is required'
        }
      ]
    }
  },

  update: {
    by: ['id'],
    fields: ['name'],
    validation: {
      name: [
        {
          validator: (value) => value && value.length > 0,
          message: 'Role group name is required'
        }
      ]
    }
  },

  list: {
    fields: ['id', 'name'],
    searchableBy: ['name'],
    filterableBy: ['id'],
    orderBy: {
      name: 'asc'
    }
  },

  detail: {
    by: ['id'],
    fields: ['id', 'name'],
    fieldsForeign: {
      roles: {
        fields: ['id', 'name']
      }
    }
  },

  delete: {
    by: ['id'],
    allow: true
  }
} as ModelConfig<Prisma.RoleGroupGetPayload<{include: {roles: true}}>>