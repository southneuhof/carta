import { createEntity } from '@southneuhof/sprindle/entity'
import { defineRelationsPart, sql } from 'drizzle-orm'
import { boolean, check, decimal, index, integer, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod/v4'
import { role, roles } from '../roles/roles.entity'
import { users } from '../users/users.entity'

const auditFields = {
  createdByUserId: text('created_by_user_id').references(() => users.id),
  updatedByUserId: text('updated_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}

const write = { id: true, createdByUserId: true, updatedByUserId: true, createdAt: true, updatedAt: true } as const
const score = z.preprocess((value) => value === '' || value === undefined ? null : value, z.coerce.number().min(0).max(100).nullable().optional()).transform((value) => value == null ? value : String(value))
const optionalText = (max = 255) => z.string().trim().max(max).nullable().optional()

export const syllabi = pgTable('syllabi', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  imgThumbnail: text('img_thumbnail'),
  isHaveQuiz: boolean('is_have_quiz').notNull().default(false),
  questionType: text('question_type'),
  minScore: decimal('min_score', { precision: 5, scale: 2 }),
  timeLimit: integer('time_limit'),
  totalQuestion: integer('total_question').notNull().default(0),
  isShuffleQuestion: boolean('is_shuffle_question').notNull().default(false),
  isShuffleOption: boolean('is_shuffle_option').notNull().default(false),
  description: text('description'),
  active: boolean('active').notNull().default(true),
  ...auditFields,
})

export const syllabusCategories = pgTable('syllabus_categories', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  imgThumbnail: text('img_thumbnail'),
  description: text('description'),
  active: boolean('active').notNull().default(true),
  ...auditFields,
})

export const syllabusCategoryMappings = pgTable(
  'syllabus_category_mappings',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    syllabusCategoryId: text('syllabus_category_id').notNull().references(() => syllabusCategories.id, { onDelete: 'cascade' }),
    syllabusId: text('syllabus_id').notNull().references(() => syllabi.id, { onDelete: 'cascade' }),
    description: text('description'),
    active: boolean('active').notNull().default(true),
    ...auditFields,
  },
  (table) => [
    uniqueIndex('syllabus_category_mappings_pair_idx').on(table.syllabusCategoryId, table.syllabusId),
    index('syllabus_category_mappings_syllabus_idx').on(table.syllabusId),
  ],
)

export const syllabusCategoryRoles = pgTable(
  'syllabus_category_roles',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    syllabusCategoryId: text('syllabus_category_id').notNull().references(() => syllabusCategories.id, { onDelete: 'cascade' }),
    roleId: text('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
    description: text('description'),
    active: boolean('active').notNull().default(true),
    ...auditFields,
  },
  (table) => [
    uniqueIndex('syllabus_category_roles_pair_idx').on(table.syllabusCategoryId, table.roleId),
    index('syllabus_category_roles_role_idx').on(table.roleId),
  ],
)

export const learningMaterials = pgTable(
  'learning_materials',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    syllabusId: text('syllabus_id').notNull().references(() => syllabi.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: text('type').notNull().default('content'),
    imgThumbnail: text('img_thumbnail'),
    file: text('file'),
    displayOrder: integer('display_order').notNull().default(1),
    description: text('description'),
    content: text('content'),
    isHaveQuiz: boolean('is_have_quiz').notNull().default(false),
    minScore: decimal('min_score', { precision: 5, scale: 2 }),
    timeLimit: integer('time_limit'),
    totalQuestion: integer('total_question').notNull().default(0),
    isShuffleQuestion: boolean('is_shuffle_question').notNull().default(false),
    isShuffleOption: boolean('is_shuffle_option').notNull().default(false),
    active: boolean('active').notNull().default(true),
    ...auditFields,
  },
  (table) => [
    index('learning_materials_syllabus_idx').on(table.syllabusId),
    uniqueIndex('learning_materials_syllabus_order_idx').on(table.syllabusId, table.displayOrder),
    check('learning_materials_display_order_check', sql`${table.displayOrder} >= 0`),
  ],
)

export const syllabusLearningMaterialQuiz = pgTable(
  'syllabus_learning_material_quiz',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    syllabusId: text('syllabus_id').notNull().references(() => syllabi.id, { onDelete: 'cascade' }),
    learningMaterialId: text('learning_material_id').notNull().references(() => learningMaterials.id, { onDelete: 'cascade' }),
    totalQuestion: integer('total_question').notNull().default(0),
    active: boolean('active').notNull().default(true),
    ...auditFields,
  },
  (table) => [
    uniqueIndex('syllabus_learning_material_quiz_pair_idx').on(table.syllabusId, table.learningMaterialId),
    index('syllabus_learning_material_quiz_syllabus_idx').on(table.syllabusId),
  ],
)

export const learningMaterialAttachments = pgTable(
  'learning_material_attachments',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    learningMaterialId: text('learning_material_id').notNull().references(() => learningMaterials.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    fileAttachment: text('file_attachment'),
    description: text('description'),
    active: boolean('active').notNull().default(true),
    ...auditFields,
  },
  (table) => [index('learning_material_attachments_material_idx').on(table.learningMaterialId)],
)

export const learningMaterialQuestions = pgTable(
  'learning_material_questions',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    learningMaterialId: text('learning_material_id').notNull().references(() => learningMaterials.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    active: boolean('active').notNull().default(true),
    ...auditFields,
  },
  (table) => [index('learning_material_questions_material_idx').on(table.learningMaterialId)],
)

export const learningMaterialQuestionAnswers = pgTable(
  'learning_material_question_answers',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    learningMaterialQuestionId: text('learning_material_question_id').notNull().references(() => learningMaterialQuestions.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    name: text('name').notNull(),
    isAnswer: boolean('is_answer').notNull().default(false),
    active: boolean('active').notNull().default(true),
    ...auditFields,
  },
  (table) => [
    uniqueIndex('learning_material_question_answers_pair_idx').on(table.learningMaterialQuestionId, table.code),
    index('learning_material_question_answers_question_idx').on(table.learningMaterialQuestionId),
  ],
)

export const syllabusLearningMaterialQuizEntity = createEntity({
  table: syllabusLearningMaterialQuiz,
  schemas: {
    create: createInsertSchema(syllabusLearningMaterialQuiz).omit(write),
    update: createUpdateSchema(syllabusLearningMaterialQuiz).omit(write),
    select: createSelectSchema(syllabusLearningMaterialQuiz),
  },
})

export const syllabus = createEntity({
  table: syllabi,
  schemas: {
    create: createInsertSchema(syllabi).omit({ ...write, totalQuestion: true }).extend({
      name: z.string().trim().min(1).max(255),
      imgThumbnail: optionalText(2000),
      questionType: optionalText(100),
      minScore: score,
      timeLimit: z.coerce.number().int().min(0).nullable().optional(),
      description: optionalText(5000),
      isHaveQuiz: z.boolean().default(false),
      isShuffleQuestion: z.boolean().default(false),
      isShuffleOption: z.boolean().default(false),
      active: z.boolean().default(true),
    }),
    update: createUpdateSchema(syllabi).omit({ ...write, totalQuestion: true }).extend({
      name: z.string().trim().min(1).max(255).optional(),
      imgThumbnail: optionalText(2000),
      questionType: optionalText(100),
      minScore: score,
      timeLimit: z.coerce.number().int().min(0).nullable().optional(),
      description: optionalText(5000),
      isHaveQuiz: z.boolean().optional(),
      isShuffleQuestion: z.boolean().optional(),
      isShuffleOption: z.boolean().optional(),
      active: z.boolean().optional(),
    }),
    select: createSelectSchema(syllabi).extend({ quizMaterials: z.array(syllabusLearningMaterialQuizEntity.schemas.select).optional() }),
  },
})

export const syllabusCategory = createEntity({
  table: syllabusCategories,
  schemas: {
    create: createInsertSchema(syllabusCategories).omit(write).extend({ name: z.string().trim().min(1).max(255), imgThumbnail: optionalText(2000), description: optionalText(5000), active: z.boolean().default(true) }),
    update: createUpdateSchema(syllabusCategories).omit(write).extend({ name: z.string().trim().min(1).max(255).optional(), imgThumbnail: optionalText(2000), description: optionalText(5000), active: z.boolean().optional() }),
    select: createSelectSchema(syllabusCategories),
  },
})

export const syllabusCategoryMapping = createEntity({
  table: syllabusCategoryMappings,
  schemas: {
    create: createInsertSchema(syllabusCategoryMappings).omit(write),
    update: createUpdateSchema(syllabusCategoryMappings).omit({ ...write, syllabusCategoryId: true, syllabusId: true }),
    select: createSelectSchema(syllabusCategoryMappings).extend({ syllabus: syllabus.schemas.select.nullable().optional() }),
  },
})

export const syllabusCategoryRole = createEntity({
  table: syllabusCategoryRoles,
  schemas: {
    create: createInsertSchema(syllabusCategoryRoles).omit(write),
    update: createUpdateSchema(syllabusCategoryRoles).omit({ ...write, syllabusCategoryId: true, roleId: true }),
    select: createSelectSchema(syllabusCategoryRoles).extend({ role: role.schemas.select.nullable().optional() }),
  },
})

export const learningMaterialQuestionAnswer = createEntity({
  table: learningMaterialQuestionAnswers,
  schemas: {
    create: createInsertSchema(learningMaterialQuestionAnswers).omit(write).extend({ code: z.string().trim().min(1).max(20), name: z.string().trim().min(1).max(500), isAnswer: z.boolean().default(false) }),
    update: createUpdateSchema(learningMaterialQuestionAnswers).omit({ ...write, learningMaterialQuestionId: true }).extend({ code: z.string().trim().min(1).max(20).optional(), name: z.string().trim().min(1).max(500).optional(), isAnswer: z.boolean().optional() }),
    select: createSelectSchema(learningMaterialQuestionAnswers),
  },
})

export const learningMaterialQuestion = createEntity({
  table: learningMaterialQuestions,
  schemas: {
    create: createInsertSchema(learningMaterialQuestions).omit(write).extend({ name: z.string().trim().min(1).max(500), active: z.boolean().default(true) }),
    update: createUpdateSchema(learningMaterialQuestions).omit({ ...write, learningMaterialId: true }).extend({ name: z.string().trim().min(1).max(500).optional(), active: z.boolean().optional() }),
    select: createSelectSchema(learningMaterialQuestions).extend({ answers: z.array(learningMaterialQuestionAnswer.schemas.select).optional() }),
  },
})

export const learningMaterialAttachment = createEntity({
  table: learningMaterialAttachments,
  schemas: {
    create: createInsertSchema(learningMaterialAttachments).omit({ ...write, learningMaterialId: true }).extend({ name: z.string().trim().min(1).max(255), fileAttachment: optionalText(2000), description: optionalText(5000), active: z.boolean().default(true) }),
    update: createUpdateSchema(learningMaterialAttachments).omit({ ...write, learningMaterialId: true }).extend({ name: z.string().trim().min(1).max(255).optional(), fileAttachment: optionalText(2000), description: optionalText(5000), active: z.boolean().optional() }),
    select: createSelectSchema(learningMaterialAttachments),
  },
})

export const learningMaterial = createEntity({
  table: learningMaterials,
  schemas: {
    create: createInsertSchema(learningMaterials).omit({ ...write, displayOrder: true, totalQuestion: true }).extend({
      syllabusId: z.string().trim().min(1),
      name: z.string().trim().min(1).max(255),
      type: z.string().trim().min(1).max(100).default('content'),
      imgThumbnail: optionalText(2000),
      file: optionalText(2000),
      description: optionalText(5000),
      content: z.string().trim().min(1),
      minScore: score,
      timeLimit: z.coerce.number().int().min(0).nullable().optional(),
      isHaveQuiz: z.boolean().default(false),
      isShuffleQuestion: z.boolean().default(false),
      isShuffleOption: z.boolean().default(false),
      active: z.boolean().default(true),
    }),
    update: createUpdateSchema(learningMaterials).omit({ ...write, displayOrder: true, totalQuestion: true, syllabusId: true }).extend({
      name: z.string().trim().min(1).max(255).optional(),
      type: z.string().trim().min(1).max(100).optional(),
      imgThumbnail: optionalText(2000),
      file: optionalText(2000),
      description: optionalText(5000),
      content: z.string().trim().min(1).optional(),
      minScore: score,
      timeLimit: z.coerce.number().int().min(0).nullable().optional(),
      isHaveQuiz: z.boolean().optional(),
      isShuffleQuestion: z.boolean().optional(),
      isShuffleOption: z.boolean().optional(),
      active: z.boolean().optional(),
    }),
    select: createSelectSchema(learningMaterials).extend({ syllabus: syllabus.schemas.select.nullable().optional() }),
  },
})

export const syllabusQuizMaterialInput = z.object({
  learningMaterialId: z.string().trim().min(1),
  totalQuestion: z.coerce.number().int().min(0),
  active: z.boolean().default(true),
})

export const syllabusUpdateWorkflow = syllabus.schemas.update.extend({ quizMaterials: z.array(syllabusQuizMaterialInput).optional() })
export const syllabusQuizMaterialResponse = syllabusLearningMaterialQuizEntity.schemas.select.extend({ learningMaterial: learningMaterial.schemas.select.nullable().optional() })
export const syllabusResponse = createSelectSchema(syllabi).extend({ quizMaterials: z.array(syllabusQuizMaterialResponse).default([]) })
export const learningMaterialResponse = createSelectSchema(learningMaterials).extend({
  syllabus: syllabus.schemas.select.nullable().optional(),
  attachments: z.array(learningMaterialAttachment.schemas.select).default([]),
  questions: z.array(learningMaterialQuestion.schemas.select).default([]),
})

export const questionWorkflow = learningMaterialQuestion.schemas.create.omit({ learningMaterialId: true }).extend({
  answers: z.array(learningMaterialQuestionAnswer.schemas.create.omit({ learningMaterialQuestionId: true })).min(1).max(10),
})
export const questionUpdateWorkflow = learningMaterialQuestion.schemas.update.extend({
  answers: z.array(learningMaterialQuestionAnswer.schemas.create.omit({ learningMaterialQuestionId: true })).min(1).max(10).optional(),
})

export const orientationRelations = defineRelationsPart({
  syllabi,
  syllabusCategories,
  syllabusCategoryMappings,
  syllabusCategoryRoles,
  syllabusLearningMaterialQuiz,
  learningMaterials,
  learningMaterialAttachments,
  learningMaterialQuestions,
  learningMaterialQuestionAnswers,
  roles,
}, (r) => ({
  syllabi: { quizMaterials: r.many.syllabusLearningMaterialQuiz({ from: r.syllabi.id, to: r.syllabusLearningMaterialQuiz.syllabusId }) },
  syllabusCategories: {
    mappings: r.many.syllabusCategoryMappings({ from: r.syllabusCategories.id, to: r.syllabusCategoryMappings.syllabusCategoryId }),
    roles: r.many.syllabusCategoryRoles({ from: r.syllabusCategories.id, to: r.syllabusCategoryRoles.syllabusCategoryId }),
  },
  syllabusCategoryMappings: {
    syllabus: r.one.syllabi({ from: r.syllabusCategoryMappings.syllabusId, to: r.syllabi.id }),
    syllabusCategory: r.one.syllabusCategories({ from: r.syllabusCategoryMappings.syllabusCategoryId, to: r.syllabusCategories.id }),
  },
  syllabusCategoryRoles: {
    syllabusCategory: r.one.syllabusCategories({ from: r.syllabusCategoryRoles.syllabusCategoryId, to: r.syllabusCategories.id }),
    role: r.one.roles({ from: r.syllabusCategoryRoles.roleId, to: r.roles.id }),
  },
  syllabusLearningMaterialQuiz: {
    syllabus: r.one.syllabi({ from: r.syllabusLearningMaterialQuiz.syllabusId, to: r.syllabi.id }),
    learningMaterial: r.one.learningMaterials({ from: r.syllabusLearningMaterialQuiz.learningMaterialId, to: r.learningMaterials.id }),
  },
  learningMaterials: {
    syllabus: r.one.syllabi({ from: r.learningMaterials.syllabusId, to: r.syllabi.id }),
    attachments: r.many.learningMaterialAttachments({ from: r.learningMaterials.id, to: r.learningMaterialAttachments.learningMaterialId }),
    questions: r.many.learningMaterialQuestions({ from: r.learningMaterials.id, to: r.learningMaterialQuestions.learningMaterialId }),
  },
  learningMaterialAttachments: {
    learningMaterial: r.one.learningMaterials({ from: r.learningMaterialAttachments.learningMaterialId, to: r.learningMaterials.id }),
  },
  learningMaterialQuestions: {
    learningMaterial: r.one.learningMaterials({ from: r.learningMaterialQuestions.learningMaterialId, to: r.learningMaterials.id }),
    answers: r.many.learningMaterialQuestionAnswers({ from: r.learningMaterialQuestions.id, to: r.learningMaterialQuestionAnswers.learningMaterialQuestionId }),
  },
  learningMaterialQuestionAnswers: {
    question: r.one.learningMaterialQuestions({ from: r.learningMaterialQuestionAnswers.learningMaterialQuestionId, to: r.learningMaterialQuestions.id }),
  },
}))
