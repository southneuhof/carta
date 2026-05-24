import type { ModelConfig } from '@southneuhof/landing-sveltekit-framework/types';
import { parseCode } from '@southneuhof/utilities/string';
import { parseSlug } from '$lib/utils/common';
import prisma from '$lib/utils/prisma';
import { api } from '$lib/utils/services';
import type { Prisma } from '@prisma/client';
import { reorderEntries } from '@southneuhof/landing-sveltekit-framework/server';

export default {
  allow: true,

  // View-related configurations
  view: {
    fieldsForeign: {
      calculatorType: {
        fields: ['id', 'name']
      }
    }
  },

  // List operation config
  list: {
    allow: true,
    searchableBy: ['label', 'formula', 'unit'],
    orderBy: { order: 'asc' },
    filterableBy: ['calculator_type_id', 'type', 'primary'],
    fieldsForeign: {
      calculatorType: {
        fields: ['id', 'name']
      }
    }
  },

  // Detail operation config
  detail: {
    allow: true,
    by: ['id'],
    fieldsForeign: {
      calculatorType: {
        fields: ['id', 'name']
      }
    }
  },

  // Create operation config
  create: {
    allow: true,
    fields: ['calculator_type_id', 'order', 'type', 'label', 'formula', 'unit', 'primary'],
    validation: {
      calculator_type_id: [
        {
          validator: (value: string) => value.length > 0,
          message: 'Calculator type is required'
        }
      ],
      label: [
        {
          validator: (value: string) => value.length > 0,
          message: 'Label is required'
        }
      ],
      formula: [
        {
          validator: (value: string) => value.length > 0,
          message: 'Formula is required'
        }
      ],
      type: [
        {
          validator: (value: string) => ['number', 'currency'].includes(value),
          message: 'Invalid field type'
        }
      ],
    },
    lifecycle: {
      pre: async (body) => {
        const maxOrderItem = await prisma.calculatorDetailField.findFirst({
          where: {
            calculator_type_id: body.calculator_type_id,
          },
          orderBy: { order: 'desc' },
          select: { order: true },
        });
        body.order = (maxOrderItem?.order ?? 0) + 1;

        if (body.primary) {
          // Unset 'primary' for other items of the same calculator_type_id
          await prisma.calculatorDetailField.updateMany({
            where: {
              calculator_type_id: body.calculator_type_id,
              primary: true,
            },
            data: { primary: false },
          });
        }

        return body;
      },
      post: async (body, data) => {
        if (data.primary) {
          await reorderEntries({
            prisma,
            from: data.order,
            to: 1,
            model: 'calculatorDetailField',
            id: data.id,
            axis: ['calculator_type_id'],
          })
        }
        return data
      }
    },
  },

  // Update operation config
  update: {
    allow: true,
    by: ['id'],
    fields: ['order', 'type', 'label', 'formula', 'unit', 'primary'],
    validation: {
      label: [
        {
          validator: (value: string) => value.length > 0,
          message: 'Label is required'
        }
      ],
      formula: [
        {
          validator: (value: string) => value.length > 0,
          message: 'Formula is required'
        }
      ],
      type: [
        {
          validator: (value: string) => ['number', 'currency'].includes(value),
          message: 'Invalid field type'
        }
      ],
      order: [
        {
          validator: (value: number) => value >= 0,
          message: 'Order must be a non-negative number'
        }
      ]
    },
    lifecycle: {
      pre: async (body) => {
        if (body.primary) {
          await prisma.calculatorDetailField.updateMany({
            where: { primary: true },
            data: { primary: false }
          });
        }
        return body
      },
      post: async (body, data) => {
        if (data.primary) {
          console.log('udpate primary', data)
          await reorderEntries({
            prisma,
            from: data.order,
            to: 1,
            model: 'calculatorDetailField',
            id: data.id,
            axis: ['calculator_type_id'],
          })
        }
        return data
      }
    },
  },

  // Delete operation config
  delete: {
    allow: true,
    by: ['id']
  },

  // Reorder operation config
  reorder: {
    allow: true,
    axis: ['calculator_type_id']
  }
} satisfies ModelConfig<Prisma.CalculatorDetailFieldGetPayload<{include: {calculatorType: true}}>>;
