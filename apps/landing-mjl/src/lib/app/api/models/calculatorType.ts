import type { ModelConfig } from '@southneuhof/landing-sveltekit-framework/types';
import { mathjs } from '$lib/utils/math';
import type { FormType, Prisma } from '@prisma/client';

export default {
  allow: true,
  
  // View-related configurations
  view: {
    fieldsForeign: {
      fields: {
        fields: ['id', 'label', 'code']
      }
    }
  },

  // List operation config
  list: {
    allow: true,
    searchableBy: ['name', 'description'],
    orderBy: { name: 'asc' },
    filterableBy: ['id']
  },

  // Detail operation config
  detail: {
    allow: true,
    by: ['id'],
  },

  // Create operation config
  create: {
    allow: true,
    fields: ['name', 'description'],
    validation: {
      name: [
        {
          validator: (value: string) => value.length > 0,
          message: 'Name is required'
        }
      ]
    }
  },

  // Update operation config
  update: {
    allow: true,
    by: ['id'],
    fields: ['name', 'description'],
    validation: {
      name: [
        {
          validator: (value: string) => value.length > 0,
          message: 'Name is required'
        },
      ],
      // formula: [
      //   {
      //     validator: (value: string) => value?.length > 0,
      //     message: 'Formula is required'
      //   },
      // ]
    },
    lifecycle: {
      pre: async (body) => {
        if (!body.formula) return body
        try {
          mathjs.evaluate(body.formula, Object.fromEntries(body.fields.map((field: any) => [field.code, 1])))
          return body
        } catch (err) {
          throw err
        }
      }
    }
  },

  // Delete operation config
  delete: {
    allow: true,
    by: ['id']
  }
} satisfies ModelConfig<Prisma.CalculatorTypeGetPayload<{include: {fields: true}}>>;