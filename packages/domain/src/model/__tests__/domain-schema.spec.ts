import { relations } from 'drizzle-orm'
import { pgTable, text } from 'drizzle-orm/pg-core'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { createEntity, defineDomainSchema } from '../domain-schema'

const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
})

const posts = pgTable('posts', {
  id: text('id').primaryKey(),
  authorId: text('author_id'),
})

const user = createEntity({
  table: users,
  schemas: {
    create: z.object({ id: z.string(), name: z.string() }),
    update: z.object({ name: z.string() }),
    select: z.object({ id: z.string(), name: z.string() }),
  },
})

const postRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}))

describe('defineDomainSchema', () => {
  it('accepts relation fields that match Drizzle relation keys', () => {
    const post = createEntity({
      table: posts,
      schemas: {
        create: z.object({ id: z.string(), authorId: z.string().nullable() }),
        update: z.object({ authorId: z.string().nullable() }),
        select: z.object({ id: z.string(), authorId: z.string().nullable(), author: user.schemas.select.nullable() }),
      },
    })

    expect(() => defineDomainSchema([{ users, user, posts, post, postRelations }])).not.toThrow()
  })

  it('rejects createEntity relations input', () => {
    expect(() =>
      createEntity({
        table: posts,
        relations: postRelations,
        schemas: { create: z.object({}), update: z.object({}), select: z.object({ id: z.string() }) },
      } as never),
    ).toThrow('createEntity() does not accept relations.')
  })

  it('rejects missing relation keys', () => {
    const post = createEntity({
      table: posts,
      schemas: {
        create: z.object({ id: z.string(), authorId: z.string().nullable() }),
        update: z.object({ authorId: z.string().nullable() }),
        select: z.object({ id: z.string(), authorId: z.string().nullable(), createdBy: user.schemas.select.nullable() }),
      },
    })

    expect(() => defineDomainSchema([{ users, user, posts, post, postRelations }])).toThrow('Missing Drizzle relation for select field "createdBy"')
  })

  it('rejects cardinality mismatch', () => {
    const post = createEntity({
      table: posts,
      schemas: {
        create: z.object({ id: z.string(), authorId: z.string().nullable() }),
        update: z.object({ authorId: z.string().nullable() }),
        select: z.object({ id: z.string(), authorId: z.string().nullable(), author: z.array(user.schemas.select) }),
      },
    })

    expect(() => defineDomainSchema([{ users, user, posts, post, postRelations }])).toThrow('Cardinality mismatch for relation "author"')
  })

  it('rejects unknown extra object fields', () => {
    const post = createEntity({
      table: posts,
      schemas: {
        create: z.object({ id: z.string(), authorId: z.string().nullable() }),
        update: z.object({ authorId: z.string().nullable() }),
        select: z.object({ id: z.string(), authorId: z.string().nullable(), displayName: z.object({ value: z.string() }) }),
      },
    })

    expect(() => defineDomainSchema([{ users, user, posts, post, postRelations }])).toThrow('Unknown nested object field "displayName"')
  })
})
