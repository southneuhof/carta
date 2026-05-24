import type { ModelConfig } from '@southneuhof/landing-sveltekit-framework/types';
import { parseCode } from '@southneuhof/utilities/string';
import { parseSlug } from '$lib/utils/common';
import prisma from '$lib/utils/prisma';
import type { FormField, Prisma } from '@prisma/client';

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
    searchableBy: ['label'],
    orderBy: { order: 'asc' },
    filterableBy: ['calculator_type_id', 'type'],
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
    fields: ['calculator_type_id', 'order', 'type', 'label', 'code', 'data', 'required', 'helper_message', 'col_span'],
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
      type: [
        {
          validator: (value: string) => ['number', 'select'].includes(value),
          message: 'Invalid field type'
        }
      ],
    },
    lifecycle: {
      pre: async (body) => {
        // get the max order of the form type and increment it
        const maxOrderItem = await prisma.calculatorField.findFirst({
          where: { 
            calculator_type_id: body.calculator_type_id,
          },
          orderBy: { order: 'desc' },
          select: { order: true }
        });

        body.order = (maxOrderItem?.order ?? 0) + 1;
        body.code = parseCode(body.label)
        return body;
      }
    },
  },

  // Update operation config
  update: {
    allow: true,
    by: ['id'],
    fields: ['order', 'type', 'label', 'code', 'required', 'data', 'helper_message', 'col_span'],
    validation: {
      label: [
        {
          validator: (value: string) => value.length > 0,
          message: 'Label is required'
        }
      ],
      type: [
        {
          validator: (value: string) => ['number', 'select'].includes(value),
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
        body.code = parseCode(body.label)
        return body;
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
} satisfies ModelConfig<Prisma.CalculatorFieldGetPayload<{include: {calculatorType: true}}>>;
