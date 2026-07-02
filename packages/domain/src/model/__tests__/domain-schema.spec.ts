import { relations } from 'drizzle-orm'
import { pgTable, text } from 'drizzle-orm/pg-core'
import { beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { createEntity, defineDomainSchema, registerEntity, registerRelations, registerTable, resetDomainRegistryForTests } from '../domain-schema'

const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
})

const posts = pgTable('posts', {
  id: text('id').primaryKey(),
  authorId: text('author_id'),
})

const comments = pgTable('comments', {
  id: text('id').primaryKey(),
  postId: text('post_id'),
})

const user = createEntity({
  table: users,
  schemas: {
    create: z.object({ id: z.string(), name: z.string() }),
    update: z.object({ name: z.string() }),
    select: z.object({ id: z.string(), name: z.string() }),
  },
})

const comment = createEntity({
  table: comments,
  schemas: {
    create: z.object({ id: z.string(), postId: z.string().nullable() }),
    update: z.object({ postId: z.string().nullable() }),
    select: z.object({ id: z.string(), postId: z.string().nullable() }),
  },
})

const postRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}))

const commentRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
}))

function postWithSelect(select: z.ZodRawShape) {
  return createEntity({
    table: posts,
    schemas: {
      create: z.object({ id: z.string(), authorId: z.string().nullable() }),
      update: z.object({ authorId: z.string().nullable() }),
      select: z.object({ id: z.string(), authorId: z.string().nullable(), ...select }),
    },
  })
}

function registerBase(post = postWithSelect({ author: user.schemas.select.nullable() })) {
  registerTable(users)
  registerTable(posts)
  registerEntity(user)
  registerEntity(post)
  registerRelations(postRelations)
  return post
}

beforeEach(() => {
  resetDomainRegistryForTests()
})

describe('defineDomainSchema', () => {
  it('accepts relation fields that match Drizzle relation keys', () => {
    registerBase()

    expect(() => defineDomainSchema()).not.toThrow()
  })

  it('accepts multiple relations from one registration scope', () => {
    const post = registerBase()
    registerTable(comments)
    registerEntity(comment)
    registerRelations(commentRelations)

    const schema = defineDomainSchema()

    expect(schema.entities).toEqual([user, post, comment])
    expect(schema.relationsByTable.has(posts)).toBe(true)
    expect(schema.relationsByTable.has(comments)).toBe(true)
  })

  it('rejects duplicate table registration', () => {
    registerTable(users)

    expect(() => registerTable(users)).toThrow('Table "users" is already registered.')
  })

  it('rejects duplicate relation registration for a table', () => {
    registerRelations(postRelations)

    expect(() => registerRelations(postRelations)).toThrow('Relations for table "posts" are already registered.')
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
    const post = postWithSelect({ createdBy: user.schemas.select.nullable() })
    registerBase(post)

    expect(() => defineDomainSchema()).toThrow('Missing Drizzle relation for select field "createdBy"')
  })

  it('rejects cardinality mismatch', () => {
    const post = postWithSelect({ author: z.array(user.schemas.select) })
    registerBase(post)

    expect(() => defineDomainSchema()).toThrow('Cardinality mismatch for relation "author"')
  })

  it('rejects unknown extra object fields', () => {
    const post = postWithSelect({ displayName: z.object({ value: z.string() }) })
    registerBase(post)

    expect(() => defineDomainSchema()).toThrow('Unknown nested object field "displayName"')
  })
})
