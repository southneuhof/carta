import { describe, expect, it } from 'vitest'
import contentGallery from '@client/section-schema/sections/content-gallery'
import { mergeSectionMetaWithDefaults, normalizeSectionMetaForSubmit } from '../sectionMetaForm'

describe('sectionMetaForm', () => {
  it('merges schema defaults when persisted content-gallery meta is missing values', () => {
    const merged = mergeSectionMetaWithDefaults(
      contentGallery.meta?.defaultValues as Record<string, unknown>,
      {
        gallery_item_type: null,
        gallery_media_type: 'icon',
      },
    )

    expect(merged.gallery_item_type).toBe('plain')
    expect(merged.gallery_media_type).toBe('icon')
    expect(merged.gallery_display_mode).toBe('static')
  })

  it('normalizes hidden dependency-controlled meta fields back to schema defaults', () => {
    const normalized = normalizeSectionMetaForSubmit({
      meta: {
        ...(contentGallery.meta?.defaultValues ?? {}),
        gallery_media_type: 'icon',
        gallery_media_radius: null,
        gallery_media_size: null,
        gallery_media_aspect_ratio: null,
      },
      inputConfig: contentGallery.meta?.editor?.inputConfig,
      defaultValues: contentGallery.meta?.defaultValues as Record<string, unknown>,
    })

    expect(normalized.gallery_media_radius).toBe('sm')
    expect(normalized.gallery_media_size).toBe('md')
    expect(normalized.gallery_media_aspect_ratio).toBe('auto')
  })
})
