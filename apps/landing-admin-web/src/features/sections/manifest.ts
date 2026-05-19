import type {
  NestedSectionSchema,
  SectionSchema,
  SectionSchemaRegistry,
} from '@southneuhof/landing-sveltekit-framework/types'

type SectionSchemaModule = Record<string, unknown>

const schemaModules = import.meta.glob('@southneuhof/landing-section-schema/sections/**/*.ts', {
  eager: true,
  import: 'default',
})

function isNestedSectionSchema(value: unknown): value is NestedSectionSchema {
  if (!value || typeof value !== 'object') return false
  const schema = value as NestedSectionSchema
  return !!schema.data && typeof schema.data === 'object'
}

function isSectionSchema(value: unknown): value is SectionSchema {
  if (!value || typeof value !== 'object') return false
  const schema = value as SectionSchema
  return typeof schema.code === 'string' && !!schema.code && !!schema.data && typeof schema.data === 'object'
}

function readSectionSchemas(modules: SectionSchemaModule): SectionSchemaRegistry {
  const schemas: SectionSchemaRegistry = {}

  for (const [path, candidate] of Object.entries(modules)) {
    if (!isSectionSchema(candidate)) {
      continue
    }

    const code = candidate.code.trim()
    if (!code) {
      throw new Error(`Invalid section schema module at "${path}". Section schema "code" must be a non-empty string.`)
    }

    if (schemas[code]) {
      throw new Error(`Duplicate section schema code "${code}" detected at "${path}".`)
    }

    for (const [slotKey, slot] of Object.entries(candidate.data)) {
      if (slot.schema && !isNestedSectionSchema(slot.schema)) {
        throw new Error(`Invalid nested schema for slot "${slotKey}" in "${code}".`)
      }
    }

    schemas[code] = candidate
  }

  return schemas
}

const sectionSchemas = readSectionSchemas(schemaModules)

export default sectionSchemas
