import type { ModelConfig } from '@southneuhof/landing-sveltekit-framework/types';
import type { CompanyProfile } from "@prisma/client";

export default {
  allow: true,
  permission: 'view-companyProfile',
  by: ['id'],
  fields: [
    'id', 'name', 'slogan', 'address', 'email', 'phone',
    'facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'whatsapp',
    'subsidiaries'
  ],

  update: {
    permission: 'update-companyProfile',
    fields: [
      'name', 'slogan', 'address', 'email', 'phone',
      'facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'whatsapp',
      'subsidiaries'
    ],
    validation: {
      email: [
        {
          validator: (value?: string) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
          message: 'Invalid email format'
        }
      ],
      phone: [
        {
          validator: (value?: string) => !value || /^[0-9+\-() ]*$/.test(value),
          message: 'Invalid phone number format'
        }
      ]
    }
  },
} as ModelConfig<CompanyProfile>;
