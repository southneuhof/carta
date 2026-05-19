import contentDefaultSchema from '@southneuhof/landing-section-schema/sections/content-default'
import dataListSchema from '@southneuhof/landing-section-schema/sections/data-list'
import { describe, expect, it } from 'vitest'

describe('section schema authoring types', () => {
  it('type-checks schema slot/meta keys and token-based editor components', () => {
    const contentFields = contentDefaultSchema.data.content.fields
    expect(contentFields).toContain('title')

    expect('componentToken' in (contentDefaultSchema.data.content.editor ?? {})).toBe(false)

    type ContentMetaField = NonNullable<typeof contentDefaultSchema.meta>['fields'][number]
    const widthPresetField: ContentMetaField = 'width_preset'
    expect(widthPresetField).toBe('width_preset')

    type ContentSlotField = NonNullable<typeof contentDefaultSchema.data.content.fields>[number]
    const titleField: ContentSlotField = 'title'
    expect(titleField).toBe('title')

    // @ts-expect-error invalid meta field key should fail
    const invalidMeta: ContentMetaField = 'unknown_meta_key'
    expect(invalidMeta).toBe('unknown_meta_key')

    // @ts-expect-error invalid slot field key should fail
    const invalidSlotField: ContentSlotField = 'not_a_field'
    expect(invalidSlotField).toBe('not_a_field')

    const nestedGallery = dataListSchema.data.childSections.schema?.data.gallery
    expect(nestedGallery?.fieldSets).toBeDefined()

    type DataListSlotKey = keyof typeof dataListSchema.data
    const childSectionsSlot: DataListSlotKey = 'childSections'
    expect(childSectionsSlot).toBe('childSections')

    // @ts-expect-error invalid top-level slot key should fail
    const invalidSlotKey: DataListSlotKey = 'gallery'
    expect(invalidSlotKey).toBe('gallery')
  })
})
