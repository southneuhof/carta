import type { SectionSchema } from '@southneuhof/landing-sveltekit-framework/types'

export function defineSectionSchema<const TSchema extends SectionSchema>(schema: TSchema): TSchema {
  return schema
}
