import type { ModelConfig } from '@southneuhof/landing-sveltekit-framework/types';
import type { Permission } from '@prisma/client'

export default {
  // Base configuration
  allow: true,
  fields: ['name', 'code', 'description'],

  // Create operation configuration
  create: {
    fields: ['name', 'code', 'description'],
    validation: {
      name: [
        {
          validator: (value) => !!value && value.length > 0,
          message: 'Permission name is required'
        }
      ],
      code: [
        {
          validator: (value) => !!value && value.length > 0,
          message: 'Permission code is required'
        }
      ]
    }
  },

  // Update operation configuration
  update: {
    fields: ['name', 'code', 'description'],
    by: ['code'],
    validation: {
      name: [
        {
          validator: (value) => !!value && value.length > 0,
          message: 'Permission name is required'
        }
      ],
      code: [
        {
          validator: (value) => !!value && value.length > 0,
          message: 'Permission code is required'
        }
      ]
    }
  },

  // List operation configuration
  list: {
    fields: ['name', 'code', 'description'],
    searchableBy: ['name', 'code', 'description'],
    filterableBy: ['code'],
    orderBy: { code: 'asc' }
  },

  // Detail operation configuration
  detail: {
    permission: 'view-permission',
    fields: ['name', 'code', 'description'],
    by: ['code']
  },

  // Delete operation configuration
  delete: {
    by: ['code']
  }
} as ModelConfig<Permission>
