import { describe, expect, it } from 'vitest'
import { defineSectionSchema } from '../defineSectionSchema'

describe('defineSectionSchema', () => {
  it('merges common meta fields into top-level section schemas', () => {
    const schema = defineSectionSchema({
      code: 'example',
      meta: {
        fields: ['title'] as const,
        defaultValues: { title: 'Example' },
      },
      data: {
        content: {
          type: 'content',
          order: 1,
          fields: ['title'] as const,
        },
      },
    })

    expect(schema.meta?.fields).toEqual([
      'section_background_color',
      'section_ornament_media',
      'section_ornament_offset',
      'title',
    ])
    expect(schema.meta?.defaultValues?.section_ornament_offset).toBe('md')
    expect(schema.meta?.defaultValues?.title).toBe('Example')
  })

  it('rejects duplicate common meta field definitions', () => {
    expect(() => defineSectionSchema({
      code: 'duplicate',
      meta: {
        fields: ['section_background_color'] as const,
      },
      data: {
        content: {
          type: 'content',
          order: 1,
        },
      },
    })).toThrow(/Duplicate common meta field/)
  })
})
