import type { ModelConfig } from '@southneuhof/landing-sveltekit-framework/types';
import { requireRoleScopedAccess } from '$lib/app/api/authorization';
import { exception } from '$lib/utils/response';
import prisma from '$lib/utils/prisma';
import type { RequestEvent } from '@sveltejs/kit';
import type { FormType, Prisma } from '@prisma/client';

export async function requireFormTypeAccess(event: RequestEvent, input: Record<string, any>) {
  const id = input.id ?? input.form_type_id;
  if (!id) return;

  const record = await prisma.formType.findUnique({
    where: { id: String(id) },
    select: {
      allowedRoles: {
        select: { id: true },
      },
    },
  });

  if (!record) throw exception('Record not found', 404);
  requireRoleScopedAccess(event.locals, record.allowedRoles.map((role) => role.id));
}

export default {
  allow: true,
  
  // View-related configurations
  view: {
    fieldsForeign: {
      fields: {
        fields: ['id', 'label', 'type']
      }
    }
  },

  // List operation config
  list: {
    allow: true,
    searchableBy: ['name', 'description'],
    orderBy: { name: 'asc' },
    filterableBy: ['id'],
    where: ({locals}) => {
      const isAdmin = Boolean(locals?.isPrivilegedRole);
      if (isAdmin) return undefined
      const roleId = locals.user?.role_id;
      if (!roleId) {
        return { id: '__no_access__' };
      }
      return {
        allowedRoles: {
          some: {
            id: roleId
          }
        }
      };
    }
  },

  // Detail operation config
  detail: {
    permission: 'detail-formType',
    authorize: requireFormTypeAccess,
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
    authorize: requireFormTypeAccess,
    allow: true,
    by: ['id'],
  },

  // Delete operation config
  delete: {
    authorize: requireFormTypeAccess,
    allow: true,
    by: ['id']
  }
} satisfies ModelConfig<Prisma.FormTypeGetPayload<{include: {allowedRoles: true, fields: true}}>>;
