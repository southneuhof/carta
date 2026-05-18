type SectionSchemaSlotType = 'content' | 'gallery' | 'section' | 'sectionGroup'
type SectionSchemaSlot = {
  type: SectionSchemaSlotType
  order: number
  many?: boolean
  data?: Record<string, SectionSchemaSlot>
}
type SectionSchema = {
  code: string
  info?: {
    name?: string
    description?: string
  }
  data: Record<string, SectionSchemaSlot>
}
type SectionSchemaRegistry = Record<string, SectionSchema>

const schemaModules = import.meta.glob('@southneuhof/landing-section-schema/sections/**/*.ts', {
  eager: true,
  import: 'default',
})

function isSectionSchema(value: unknown): value is SectionSchema {
  if (!value || typeof value !== 'object') return false
  const schema = value as SectionSchema
  return typeof schema.code === 'string' && !!schema.code && !!schema.data && typeof schema.data === 'object'
}

function readSectionSchemas(modules: Record<string, unknown>): SectionSchemaRegistry {
  const schemas: SectionSchemaRegistry = {}

  for (const [path, candidate] of Object.entries(modules)) {
    if (!isSectionSchema(candidate)) {
      throw new Error(`Invalid section schema module at "${path}". Expected a default export with a non-empty "code".`)
    }

    const code = candidate.code.trim()
    if (!code) {
      throw new Error(`Invalid section schema module at "${path}". Section schema "code" must be a non-empty string.`)
    }

    if (schemas[code]) {
      throw new Error(`Duplicate section schema code "${code}" detected at "${path}".`)
    }

    schemas[code] = candidate
  }

  return schemas
}

const sectionSchemas = readSectionSchemas(schemaModules)

export default sectionSchemas
