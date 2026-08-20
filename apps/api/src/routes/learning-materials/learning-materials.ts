import { authenticated, defineRoute } from '@southneuhof/sprindle/routes'
import { notFound, unauthorized, validationError } from '@southneuhof/sprindle'
import { defineDomainPart, defineModel } from '@southneuhof/sprindle/model'
import { listQuerySchema } from '@southneuhof/sprindle/validation'
import { and, asc, count, desc, eq, ilike, ne } from 'drizzle-orm'
import { getDb } from '../../db'
import { orgIdentity, requirePermission } from '../../identity'
import {
  learningMaterial,
  learningMaterialAttachment,
  learningMaterialAttachments,
  learningMaterialQuestion,
  learningMaterialQuestionAnswer,
  learningMaterialQuestionAnswers,
  learningMaterialQuestions,
  learningMaterialResponse,
  learningMaterials,
  orientationRelations,
  questionUpdateWorkflow,
  questionWorkflow,
  syllabi,
} from '../orientation/orientation.entity'

const access = {
  list: [authenticated(), requirePermission('list-learning-materials')],
  detail: [authenticated(), requirePermission('detail-learning-materials')],
  create: [authenticated(), requirePermission('create-learning-materials')],
  update: [authenticated(), requirePermission('update-learning-materials')],
  delete: [authenticated(), requirePermission('delete-learning-materials')],
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

function requiredParam(args: Parameters<typeof actor>[0], name: string) {
  const value = args.c.req.param(name)
  if (!value) throw notFound()
  return value
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

async function ensureSyllabus(id: string) {
  const row = (await getDb().select({ id: syllabi.id }).from(syllabi).where(eq(syllabi.id, id)).limit(1))[0]
  if (!row) throw validationError('Silabus is invalid.')
}

async function materialRow(id: string) {
  const row = (await getDb().select({ material: learningMaterials, syllabus: syllabi }).from(learningMaterials).innerJoin(syllabi, eq(syllabi.id, learningMaterials.syllabusId)).where(eq(learningMaterials.id, id)).limit(1))[0]
  if (!row) throw notFound()
  return row
}

async function readMaterial(id: string) {
  const { material, syllabus: syllabusRow } = await materialRow(id)
  const attachments = await getDb().select().from(learningMaterialAttachments).where(eq(learningMaterialAttachments.learningMaterialId, id)).orderBy(asc(learningMaterialAttachments.name))
  const answerRows = await getDb().select({ question: learningMaterialQuestions, answer: learningMaterialQuestionAnswers }).from(learningMaterialQuestions).leftJoin(learningMaterialQuestionAnswers, eq(learningMaterialQuestionAnswers.learningMaterialQuestionId, learningMaterialQuestions.id)).where(eq(learningMaterialQuestions.learningMaterialId, id)).orderBy(asc(learningMaterialQuestions.id), asc(learningMaterialQuestionAnswers.code))
  const questions = [...new Map(answerRows.map(({ question }) => [question.id, question])).values()].map((question) => ({
    ...question,
    answers: answerRows.filter((row) => row.question.id === question.id && row.answer).map((row) => row.answer!),
  }))
  return learningMaterialResponse.parse({ ...material, syllabus: syllabusRow, attachments, questions })
}

export const learningMaterialList = defineRoute({
  kind: 'list',
  method: 'get',
  authorize: access.list,
  action: async (args) => {
    await actor(args)
    const query = listQuerySchema.parse(args.c.req.query()) as Record<string, unknown>
    const { page, limit } = pageOf(query)
    const conditions = [ne(learningMaterials.displayOrder, 0)]
    if (typeof query.syllabusId === 'string' && query.syllabusId) conditions.push(eq(learningMaterials.syllabusId, query.syllabusId))
    const active = booleanQuery(query.active)
    if (active !== undefined) conditions.push(eq(learningMaterials.active, active))
    const quizEnabled = booleanQuery(query.quizEnabled)
    if (quizEnabled !== undefined) conditions.push(eq(learningMaterials.isHaveQuiz, quizEnabled))
    if (booleanQuery(query.excludeFinalQuiz) === false) conditions.pop()
    if (typeof query.search === 'string' && query.search) conditions.push(ilike(learningMaterials.name, `%${query.search}%`))
    const where = and(...conditions)
    const rows = await getDb().select({ material: learningMaterials, syllabus: syllabi }).from(learningMaterials).innerJoin(syllabi, eq(syllabi.id, learningMaterials.syllabusId)).where(where).orderBy(asc(learningMaterials.syllabusId), asc(learningMaterials.displayOrder), asc(learningMaterials.name)).limit(limit).offset((page - 1) * limit)
    const total = await getDb().select({ value: count() }).from(learningMaterials).where(where)
    return args.c.json({ data: rows.map(({ material, syllabus: syllabusRow }) => learningMaterialResponse.parse({ ...material, syllabus: syllabusRow, attachments: [], questions: [] })), page, limit, total: Number(total[0]?.value ?? 0) })
  },
})

export const learningMaterialDetail = defineRoute({
  kind: 'detail',
  path: '/:id',
  method: 'get',
  authorize: access.detail,
  action: async (args) => {
    await actor(args)
    return args.c.json({ data: await readMaterial(requiredId(args)) })
  },
})

export const learningMaterialCreate = defineRoute({
  kind: 'create',
  method: 'post',
  authorize: access.create,
  action: async (args) => {
    const identity = await actor(args)
    const input = learningMaterial.schemas.create.parse(await args.c.req.json().catch(() => ({})))
    await ensureSyllabus(input.syllabusId)
    const row = await getDb().transaction(async (tx) => {
      const last = (await tx.select({ displayOrder: learningMaterials.displayOrder }).from(learningMaterials).where(eq(learningMaterials.syllabusId, input.syllabusId)).orderBy(desc(learningMaterials.displayOrder)).limit(1))[0]
      const timestamp = new Date().toISOString()
      return (await tx.insert(learningMaterials).values({
        ...input,
        name: input.name.trim(),
        imgThumbnail: input.imgThumbnail?.trim() || null,
        file: input.file?.trim() || null,
        description: input.description?.trim() || null,
        displayOrder: Math.max(1, (last?.displayOrder ?? 0) + 1),
        totalQuestion: 0,
        createdByUserId: identity.userId,
        updatedByUserId: identity.userId,
        createdAt: timestamp,
        updatedAt: timestamp,
      }).returning())[0]
    })
    if (!row) throw validationError('Materi was not created.')
    return args.c.json({ data: await readMaterial(row.id) }, 201)
  },
})

export const learningMaterialUpdate = defineRoute({
  kind: 'update',
  path: '/:id',
  method: 'patch',
  authorize: access.update,
  action: async (args) => {
    const identity = await actor(args)
    const id = requiredId(args)
    await materialRow(id)
    const input = learningMaterial.schemas.update.parse(await args.c.req.json().catch(() => ({})))
    const values: Partial<typeof learningMaterials.$inferInsert> = { ...input, updatedByUserId: identity.userId, updatedAt: new Date().toISOString() }
    if (values.name !== undefined) values.name = values.name.trim()
    if (values.imgThumbnail !== undefined) values.imgThumbnail = values.imgThumbnail?.trim() || null
    if (values.file !== undefined) values.file = values.file?.trim() || null
    if (values.description !== undefined) values.description = values.description?.trim() || null
    const row = (await getDb().update(learningMaterials).set(values).where(eq(learningMaterials.id, id)).returning())[0]
    if (!row) throw notFound()
    return args.c.json({ data: await readMaterial(row.id) })
  },
})

export const learningMaterialDelete = defineRoute({
  kind: 'delete',
  path: '/:id',
  method: 'delete',
  authorize: access.delete,
  action: async (args) => {
    await actor(args)
    const deleted = await getDb().delete(learningMaterials).where(and(eq(learningMaterials.id, requiredId(args)), ne(learningMaterials.displayOrder, 0))).returning({ id: learningMaterials.id })
    if (!deleted[0]) throw notFound()
    return args.c.json({ ok: true })
  },
})

async function ensureMaterial(id: string) {
  const row = (await getDb().select({ material: learningMaterials }).from(learningMaterials).where(eq(learningMaterials.id, id)).limit(1))[0]
  if (!row) throw notFound()
  return row.material
}

export const learningMaterialAttachmentList = defineRoute({
  kind: 'list',
  method: 'get',
  authorize: access.detail,
  action: async (args) => {
    await actor(args)
    const materialId = requiredId(args)
    await ensureMaterial(materialId)
    const rows = await getDb().select().from(learningMaterialAttachments).where(eq(learningMaterialAttachments.learningMaterialId, materialId)).orderBy(asc(learningMaterialAttachments.name))
    return args.c.json({ data: rows.map((row) => learningMaterialAttachment.schemas.select.parse(row)), page: 1, limit: rows.length, total: rows.length })
  },
})

export const learningMaterialAttachmentCreate = defineRoute({
  kind: 'create',
  method: 'post',
  authorize: access.update,
  action: async (args) => {
    const identity = await actor(args)
    const materialId = requiredId(args)
    await ensureMaterial(materialId)
    const input = learningMaterialAttachment.schemas.create.parse(await args.c.req.json().catch(() => ({})))
    const timestamp = new Date().toISOString()
    const row = (await getDb().insert(learningMaterialAttachments).values({ ...input, learningMaterialId: materialId, name: input.name.trim(), fileAttachment: input.fileAttachment?.trim() || null, description: input.description?.trim() || null, createdByUserId: identity.userId, updatedByUserId: identity.userId, createdAt: timestamp, updatedAt: timestamp }).returning())[0]
    if (!row) throw validationError('Materi attachment was not created.')
    return args.c.json({ data: learningMaterialAttachment.schemas.select.parse(row) }, 201)
  },
})

export const learningMaterialAttachmentUpdate = defineRoute({
  kind: 'update',
  path: '/:attachmentId',
  method: 'patch',
  authorize: access.update,
  action: async (args) => {
    const identity = await actor(args)
    const materialId = requiredId(args)
    await ensureMaterial(materialId)
    const attachmentId = requiredParam(args, 'attachmentId')
    const input = learningMaterialAttachment.schemas.update.parse(await args.c.req.json().catch(() => ({})))
    const values: Partial<typeof learningMaterialAttachments.$inferInsert> = { ...input, updatedByUserId: identity.userId, updatedAt: new Date().toISOString() }
    if (values.name !== undefined) values.name = values.name.trim()
    if (values.fileAttachment !== undefined) values.fileAttachment = values.fileAttachment?.trim() || null
    if (values.description !== undefined) values.description = values.description?.trim() || null
    const row = (await getDb().update(learningMaterialAttachments).set(values).where(and(eq(learningMaterialAttachments.id, attachmentId), eq(learningMaterialAttachments.learningMaterialId, materialId))).returning())[0]
    if (!row) throw notFound()
    return args.c.json({ data: learningMaterialAttachment.schemas.select.parse(row) })
  },
})

export const learningMaterialAttachmentDelete = defineRoute({
  kind: 'delete',
  path: '/:attachmentId',
  method: 'delete',
  authorize: access.update,
  action: async (args) => {
    await actor(args)
    const materialId = requiredId(args)
    await ensureMaterial(materialId)
    const deleted = await getDb().delete(learningMaterialAttachments).where(and(eq(learningMaterialAttachments.id, requiredParam(args, 'attachmentId')), eq(learningMaterialAttachments.learningMaterialId, materialId))).returning({ id: learningMaterialAttachments.id })
    if (!deleted[0]) throw notFound()
    return args.c.json({ ok: true })
  },
})

function validateAnswers(answers: Array<{ code: string; name: string; isAnswer: boolean }>) {
  if (new Set(answers.map((answer) => answer.code)).size !== answers.length) throw validationError('Pilihan Jawaban codes must be unique.')
  if (answers.filter((answer) => answer.isAnswer).length !== 1) throw validationError('Each question must have one correct answer.')
}

type DbExecutor = Pick<ReturnType<typeof getDb>, 'select' | 'update'>

async function refreshQuestionCount(materialId: string, tx: DbExecutor = getDb()) {
  const rows = await tx.select({ value: count() }).from(learningMaterialQuestions).where(eq(learningMaterialQuestions.learningMaterialId, materialId))
  const totalQuestion = Number(rows[0]?.value ?? 0)
  await tx.update(learningMaterials).set({ totalQuestion, isHaveQuiz: totalQuestion > 0, updatedAt: new Date().toISOString() }).where(eq(learningMaterials.id, materialId))
}

export const learningMaterialQuestionList = defineRoute({
  kind: 'list',
  method: 'get',
  authorize: access.detail,
  action: async (args) => {
    await actor(args)
    const materialId = requiredId(args)
    await ensureMaterial(materialId)
    const rows = await getDb().select({ question: learningMaterialQuestions, answer: learningMaterialQuestionAnswers }).from(learningMaterialQuestions).leftJoin(learningMaterialQuestionAnswers, eq(learningMaterialQuestionAnswers.learningMaterialQuestionId, learningMaterialQuestions.id)).where(eq(learningMaterialQuestions.learningMaterialId, materialId)).orderBy(asc(learningMaterialQuestions.id), asc(learningMaterialQuestionAnswers.code))
    const data = [...new Map(rows.map(({ question }) => [question.id, question])).values()].map((question) => learningMaterialQuestion.schemas.select.parse({ ...question, answers: rows.filter((row) => row.question.id === question.id && row.answer).map((row) => row.answer!) }))
    return args.c.json({ data, page: 1, limit: data.length, total: data.length })
  },
})

export const learningMaterialQuestionCreate = defineRoute({
  kind: 'create',
  method: 'post',
  authorize: access.update,
  action: async (args) => {
    const identity = await actor(args)
    const materialId = requiredId(args)
    const material = await ensureMaterial(materialId)
    if (material.displayOrder === 0) throw validationError('Final Quiz questions are managed by the Silabus.')
    const input = questionWorkflow.parse(await args.c.req.json().catch(() => ({})))
    validateAnswers(input.answers)
    const row = await getDb().transaction(async (tx) => {
      const timestamp = new Date().toISOString()
      const { answers, ...questionInput } = input
      const question = (await tx.insert(learningMaterialQuestions).values({ ...questionInput, id: crypto.randomUUID(), learningMaterialId: materialId, name: input.name.trim(), createdByUserId: identity.userId, updatedByUserId: identity.userId, createdAt: timestamp, updatedAt: timestamp }).returning())[0]
      if (!question) throw validationError('Pertanyaan was not created.')
      await tx.insert(learningMaterialQuestionAnswers).values(answers.map((answer) => ({ ...answer, id: crypto.randomUUID(), learningMaterialQuestionId: question.id, code: answer.code.trim(), name: answer.name.trim(), createdByUserId: identity.userId, updatedByUserId: identity.userId, createdAt: timestamp, updatedAt: timestamp })))
      await refreshQuestionCount(materialId, tx)
      return question
    })
    const answers = await getDb().select().from(learningMaterialQuestionAnswers).where(eq(learningMaterialQuestionAnswers.learningMaterialQuestionId, row.id)).orderBy(asc(learningMaterialQuestionAnswers.code))
    return args.c.json({ data: learningMaterialQuestion.schemas.select.parse({ ...row, answers }) }, 201)
  },
})

export const learningMaterialQuestionUpdate = defineRoute({
  kind: 'update',
  path: '/:questionId',
  method: 'patch',
  authorize: access.update,
  action: async (args) => {
    const identity = await actor(args)
    const materialId = requiredId(args)
    await ensureMaterial(materialId)
    const questionId = requiredParam(args, 'questionId')
    const input = questionUpdateWorkflow.parse(await args.c.req.json().catch(() => ({})))
    if (input.answers) validateAnswers(input.answers)
    const row = await getDb().transaction(async (tx) => {
      const current = (await tx.select().from(learningMaterialQuestions).where(and(eq(learningMaterialQuestions.id, questionId), eq(learningMaterialQuestions.learningMaterialId, materialId))).limit(1))[0]
      if (!current) throw notFound()
      const timestamp = new Date().toISOString()
      const { answers, ...questionInput } = input
      const updated = (await tx.update(learningMaterialQuestions).set({ ...questionInput, name: questionInput.name?.trim(), updatedByUserId: identity.userId, updatedAt: timestamp }).where(eq(learningMaterialQuestions.id, questionId)).returning())[0]
      if (answers) {
        await tx.delete(learningMaterialQuestionAnswers).where(eq(learningMaterialQuestionAnswers.learningMaterialQuestionId, questionId))
        await tx.insert(learningMaterialQuestionAnswers).values(answers.map((answer) => ({ ...answer, id: crypto.randomUUID(), learningMaterialQuestionId: questionId, code: answer.code.trim(), name: answer.name.trim(), createdByUserId: identity.userId, updatedByUserId: identity.userId, createdAt: timestamp, updatedAt: timestamp })))
      }
      return updated
    })
    const answers = await getDb().select().from(learningMaterialQuestionAnswers).where(eq(learningMaterialQuestionAnswers.learningMaterialQuestionId, questionId)).orderBy(asc(learningMaterialQuestionAnswers.code))
    return args.c.json({ data: learningMaterialQuestion.schemas.select.parse({ ...row, answers }) })
  },
})

export const learningMaterialQuestionDelete = defineRoute({
  kind: 'delete',
  path: '/:questionId',
  method: 'delete',
  authorize: access.update,
  action: async (args) => {
    await actor(args)
    const materialId = requiredId(args)
    await ensureMaterial(materialId)
    const questionId = requiredParam(args, 'questionId')
    const deleted = await getDb().transaction(async (tx) => {
      const rows = await tx.delete(learningMaterialQuestions).where(and(eq(learningMaterialQuestions.id, questionId), eq(learningMaterialQuestions.learningMaterialId, materialId))).returning({ id: learningMaterialQuestions.id })
      if (rows[0]) await refreshQuestionCount(materialId, tx)
      return rows[0]
    })
    if (!deleted) throw notFound()
    return args.c.json({ ok: true })
  },
})

export const domain = defineDomainPart({
  tables: {},
  entities: [learningMaterial, learningMaterialAttachment, learningMaterialQuestion, learningMaterialQuestionAnswer],
  relations: [orientationRelations],
})

export const learningMaterialsModel = defineModel({
  path: '/learning-materials',
  entity: learningMaterial,
  routes: {
    list: learningMaterialList,
    detail: learningMaterialDetail,
    create: learningMaterialCreate,
    update: learningMaterialUpdate,
    delete: learningMaterialDelete,
    ':id': {
      attachments: { list: learningMaterialAttachmentList, create: learningMaterialAttachmentCreate, ':attachmentId': { update: learningMaterialAttachmentUpdate, delete: learningMaterialAttachmentDelete } },
      questions: { list: learningMaterialQuestionList, create: learningMaterialQuestionCreate, ':questionId': { update: learningMaterialQuestionUpdate, delete: learningMaterialQuestionDelete } },
    },
  },
})
