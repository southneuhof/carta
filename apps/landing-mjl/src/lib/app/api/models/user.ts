import type { ModelConfig } from '@southneuhof/landing-sveltekit-framework/types';
import prisma from "$lib/utils/prisma";
import type { Prisma, User } from "@prisma/client";
import bcrypt from 'bcryptjs'

export default {
  // Common configurations
  allow: true,
  by: ['id'],
  fields: ['id', 'email', 'name', 'role_id'],

  view: {
    fieldsForeign: {
      role: {
        fields: ['name'],
      }
    },
  },
  
  list: {
    searchableBy: ['email', 'name'],
    filterableBy: ['role_id'],
  },
  create: {
    fields: ['name', 'email', 'role_id', 'password'],
    validation: {
      email: [
        {
          validator: (value) => !!value,
          message: 'Email is required'
        },
        {
          validator: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
          message: 'Invalid email format'
        },
      ],
      name: [
        {
          validator: (value) => !!value,
          message: 'Name is required'
        }
      ],
      role_id: [
        {
          validator: (value) => !!value,
          message: 'Role is required'
        }
      ]
    },
    lifecycle: {
      async main(body) {
        const data = await prisma.$transaction(async (tx) => {
          const passwordHash = body.password ? await bcrypt.hash(body.password, 10) : null

          const user = await tx.user.create({
            data: {
              name: body.name,
              email: body.email,
              role_id: body.role_id,
              emailVerified: true,
            }
          });

          if (passwordHash) {
            await tx.authAccount.create({
              data: {
                id: user.id,
                accountId: String(user.id),
                providerId: 'credential',
                userId: user.id,
                password: passwordHash,
              },
            });
          }

          return user;
        })

        return data
      }
    }
  },

  update: {
    fields: ['name', 'email', 'role_id', 'password'],
    lifecycle: {
      async main(body) {
        const data = await prisma.$transaction(async (tx) => {
          const passwordHash = body.password ? await bcrypt.hash(body.password, 10) : null

          const updateData: any = {
            name: body.name,
            email: body.email,
            role_id: body.role_id,
          }

          const user = await tx.user.update({
            where: { id: body.id },
            data: updateData
          });

          if (passwordHash) {
            await tx.authAccount.upsert({
              where: {
                id: user.id,
              },
              update: {
                accountId: String(user.id),
                providerId: 'credential',
                password: passwordHash,
              },
              create: {
                id: user.id,
                accountId: String(user.id),
                providerId: 'credential',
                userId: user.id,
                password: passwordHash,
              },
            });
          }

          return user;
        })

        return data
      }
    }
  },

  delete: {}
} as ModelConfig<Prisma.UserGetPayload<{include: {role: true}}>>
