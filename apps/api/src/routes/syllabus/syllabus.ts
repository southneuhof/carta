import { authenticated, defineRoute } from '@southneuhof/sprindle/routes'
import { notFound, unauthorized, validationError } from '@southneuhof/sprindle'
import { defineDomainPart, defineModel } from '@southneuhof/sprindle/model'
import { listQuerySchema } from '@southneuhof/sprindle/validation'
import { and, asc, count, eq, ilike, inArray, notInArray, type SQL } from 'drizzle-orm'
import { getDb } from '../../db'
import { orgIdentity, requirePermission } from '../../identity'
import {
  learningMaterials,
  orientationRelations,
  syllabus,
  syllabusLearningMaterialQuiz,
  syllabusLearningMaterialQuizEntity,
  syllabusCategoryMappings,
  syllabusQuizMaterialResponse,
  syllabusResponse,
  syllabusUpdateWorkflow,
  syllabi,
} from '../orientation/orientation.entity'

const access = {
  list: [authenticated(), requirePermission('list-syllabus')],
  detail: [authenticated(), requirePermission('detail-syllabus')],
  create: [authenticated(), requirePermission('create-syllabus')],
  update: [authenticated(), requirePermission('update-syllabus')],
  delete: [authenticated(), requirePermission('delete-syllabus')],
}

async function actor(args: Parameters<typeof orgIdentity>[0]) {
  const identity = await orgIdentity(args)
  if (!identity) throw unauthorized()
  return identity
}

function requiredId(args: Parameters<typeof actor>[0]) {
  const id = args.c.req.param('id')
  if (!id) throw notFound()
  return id
}

function pageOf(query: Record<string, unknown>) {
  return { page: Number(query.page), limit: Number(query.limit) }
}

function booleanQuery(value: unknown) {
  if (value === undefined) return undefined
  if (value === true || value === 'true') return true
  if (value === false || value === 'false') return false
  throw validationError('Boolean query values must be true or false.')
}

function textOrNull(value: string | null | undefined) {
  return value?.trim() || null
}

async function readSyllabus(id: string, db = getDb()) {
  const row = (await db.select().from(syllabi).where(eq(syllabi.id, id)).limit(1))[0]
  if (!row) throw notFound()
  const quizRows = await db
    .select({ quiz: syllabusLearningMaterialQuiz, learningMaterial: learningMaterials })
    .from(syllabusLearningMaterialQuiz)
    .leftJoin(learningMaterials, eq(learningMaterials.id, syllabusLearningMaterialQuiz.learningMaterialId))
    .where(eq(syllabusLearningMaterialQuiz.syllabusId, id))
    .orderBy(asc(learningMaterials.displayOrder), asc(syllabusLearningMaterialQuiz.id))
  return syllabusResponse.parse({
    ...row,
    quizMaterials: quizRows.map(({ quiz, learningMaterial: material }) => syllabusQuizMaterialResponse.parse({ ...quiz, learningMaterial: material })),
  })
}

export const syllabusList = defineRoute({
  kind: 'list',
  method: 'get',
  authorize: access.list,
  action: async (args) => {
    await actor(args)
    const query = listQuerySchema.parse(args.c.req.query()) as Record<string, unknown>
    const { page, limit } = pageOf(query)
    const conditions: SQL[] = []
    const active = booleanQuery(query.active)
    if (active !== undefined) conditions.push(eq(syllabi.active, active))
    if (typeof query.search === 'string' && query.search) conditions.push(ilike(syllabi.name, `%${query.search}%`))
    if (typeof query.notInCategoryId === 'string' && query.notInCategoryId) {
      const mapped = await getDb().select({ syllabusId: syllabusCategoryMappings.syllabusId }).from(syllabusCategoryMappings).where(eq(syllabusCategoryMappings.syllabusCategoryId, query.notInCategoryId))
      if (mapped.length) conditions.push(notInArray(syllabi.id, mapped.map((row) => row.syllabusId)))
    }
    const where = conditions.length ? and(...conditions) : undefined
    const [rows, totals] = await Promise.all([
      getDb().select().from(syllabi).where(where).orderBy(asc(syllabi.name)).limit(limit).offset((page - 1) * limit),
      getDb().select({ value: count() }).from(syllabi).where(where),
    ])
    return args.c.json({ data: rows.map((row) => syllabusResponse.parse({ ...row, quizMaterials: [] })), page, limit, total: Number(totals[0]?.value ?? 0) })
  },
})

export const syllabusDetail = defineRoute({
  kind: 'detail',
  path: '/:id',
  method: 'get',
  authorize: access.detail,
  action: async (args) => {
    await actor(args)
    return args.c.json({ data: await readSyllabus(requiredId(args)) })
  },
})

export const syllabusCreate = defineRoute({
  kind: 'create',
  method: 'post',
  authorize: access.create,
  action: async (args) => {
    const identity = await actor(args)
    const input = syllabus.schemas.create.parse(await args.c.req.json().catch(() => ({})))
    const timestamp = new Date().toISOString()
    const inserted = await getDb().insert(syllabi).values({
      ...input,
      name: input.name.trim(),
      imgThumbnail: textOrNull(input.imgThumbnail),
      questionType: textOrNull(input.questionType),
      description: textOrNull(input.description),
      createdByUserId: identity.userId,
      updatedByUserId: identity.userId,
      createdAt: timestamp,
      updatedAt: timestamp,
    }).returning()
    const row = inserted[0]
    if (!row) throw validationError('Silabus was not created.')
    if (row.isHaveQuiz) await syncFinalQuiz(getDb(), row, identity.userId)
    return args.c.json({ data: await readSyllabus(row.id) }, 201)
  },
})

type DbExecutor = Pick<ReturnType<typeof getDb>, 'select' | 'insert' | 'update' | 'delete'>

async function validateQuizMaterials(syllabusId: string, rows: Array<{ learningMaterialId: string; totalQuestion: number; active: boolean }>, db: DbExecutor) {
  const ids = rows.map((row) => row.learningMaterialId)
  if (new Set(ids).size !== ids.length) throw validationError('Quiz material rows must be unique.')
  if (!ids.length) return new Map<string, number>()
  const materials = await db.select().from(learningMaterials).where(and(eq(learningMaterials.syllabusId, syllabusId), inArray(learningMaterials.id, ids)))
  if (materials.length !== ids.length) throw validationError('Quiz materials must belong to the current Silabus.')
  const valid = materials.every((material) => material.active && material.displayOrder !== 0 && material.type !== 'final-quiz' && material.isHaveQuiz)
  if (!valid) throw validationError('Quiz materials must be active normal materials with a quiz.')
  return new Map(materials.map((material) => [material.id, material.totalQuestion]))
}

async function syncFinalQuiz(tx: DbExecutor, syllabusRow: typeof syllabi.$inferSelect, identityId: string) {
  const timestamp = new Date().toISOString()
  const current = (await tx.select().from(learningMaterials).where(and(eq(learningMaterials.syllabusId, syllabusRow.id), eq(learningMaterials.displayOrder, 0))).limit(1))[0]
  const values = {
    syllabusId: syllabusRow.id,
    name: 'Final Quiz',
    type: 'final-quiz',
    displayOrder: 0,
    description: syllabusRow.description,
    content: null,
    isHaveQuiz: true,
    minScore: syllabusRow.minScore,
    timeLimit: syllabusRow.timeLimit,
    totalQuestion: syllabusRow.totalQuestion,
    isShuffleQuestion: syllabusRow.isShuffleQuestion,
    isShuffleOption: syllabusRow.isShuffleOption,
    active: syllabusRow.active,
    updatedByUserId: identityId,
    updatedAt: timestamp,
  } as const
  if (current) {
    await tx.update(learningMaterials).set(values).where(eq(learningMaterials.id, current.id))
    return
  }
  await tx.insert(learningMaterials).values({ ...values, id: crypto.randomUUID(), createdByUserId: identityId, createdAt: timestamp })
}

export const syllabusUpdate = defineRoute({
  kind: 'update',
  path: '/:id',
  method: 'patch',
  authorize: access.update,
  action: async (args) => {
    const identity = await actor(args)
    const id = requiredId(args)
    const current = (await getDb().select().from(syllabi).where(eq(syllabi.id, id)).limit(1))[0]
    if (!current) throw notFound()
    const input = syllabusUpdateWorkflow.parse(await args.c.req.json().catch(() => ({})))
    const { quizMaterials, ...syllabusInput } = input
    await getDb().transaction(async (tx) => {
      const timestamp = new Date().toISOString()
      const values: Partial<typeof syllabi.$inferInsert> = { ...syllabusInput, updatedByUserId: identity.userId, updatedAt: timestamp }
      if (values.name !== undefined) values.name = values.name.trim()
      if (values.imgThumbnail !== undefined) values.imgThumbnail = textOrNull(values.imgThumbnail)
      if (values.questionType !== undefined) values.questionType = textOrNull(values.questionType)
      if (values.description !== undefined) values.description = textOrNull(values.description)
      await tx.update(syllabi).set(values).where(eq(syllabi.id, id))
      const next = { ...current, ...values }
      let totalQuestion = current.totalQuestion
      if (quizMaterials !== undefined) {
        const materialTotals = await validateQuizMaterials(id, quizMaterials, tx)
        totalQuestion = quizMaterials.reduce((total, row) => total + (row.active ? materialTotals.get(row.learningMaterialId) ?? 0 : 0), 0)
        await tx.delete(syllabusLearningMaterialQuiz).where(eq(syllabusLearningMaterialQuiz.syllabusId, id))
        if (quizMaterials.length) {
          await tx.insert(syllabusLearningMaterialQuiz).values(quizMaterials.map((row) => ({
            id: crypto.randomUUID(),
            syllabusId: id,
            learningMaterialId: row.learningMaterialId,
            totalQuestion: materialTotals.get(row.learningMaterialId) ?? 0,
            active: row.active,
            createdByUserId: identity.userId,
            updatedByUserId: identity.userId,
            createdAt: timestamp,
            updatedAt: timestamp,
          })))
        }
      } else if (values.isHaveQuiz === false) {
        totalQuestion = 0
        await tx.update(syllabusLearningMaterialQuiz).set({ active: false, updatedByUserId: identity.userId, updatedAt: timestamp }).where(eq(syllabusLearningMaterialQuiz.syllabusId, id))
      }
      await tx.update(syllabi).set({ totalQuestion, updatedByUserId: identity.userId, updatedAt: timestamp }).where(eq(syllabi.id, id))
      const finalRow = { ...next, totalQuestion }
      if (finalRow.isHaveQuiz) await syncFinalQuiz(tx, finalRow, identity.userId)
    })
    return args.c.json({ data: await readSyllabus(id) })
  },
})

export const syllabusDelete = defineRoute({
  kind: 'delete',
  path: '/:id',
  method: 'delete',
  authorize: access.delete,
  action: async (args) => {
    await actor(args)
    const deleted = await getDb().delete(syllabi).where(eq(syllabi.id, requiredId(args))).returning({ id: syllabi.id })
    if (!deleted[0]) throw notFound()
    return args.c.json({ ok: true })
  },
})

export const domain = defineDomainPart({
  tables: {},
  entities: [syllabus, syllabusLearningMaterialQuizEntity],
  relations: [orientationRelations],
})

export const syllabusModel = defineModel({
  path: '/syllabus',
  entity: syllabus,
  routes: { list: syllabusList, detail: syllabusDetail, create: syllabusCreate, update: syllabusUpdate, delete: syllabusDelete },
})
