import contentDefaultSchema from '@southneuhof/landing-section-schema/sections/content-default'
import dataListSchema from '@southneuhof/landing-section-schema/sections/data-list'
import type { Component } from 'vue'
import { describe, it } from 'vitest'
import { defineSectionEditorOverlay } from '@/configs/sections'

describe('section overlay typing', () => {
  it('type-checks schema-aware slot and meta keys', () => {
    defineSectionEditorOverlay(contentDefaultSchema, {
      meta: {
        inputConfig: {
          width_preset: { type: 'select' },
        },
      },
      slots: {
        content: {
          label: 'Content',
          component: {} as Component,
        },
      },
    })

    defineSectionEditorOverlay(contentDefaultSchema, {
      slots: {
        // @ts-expect-error invalid slot key should fail typing
        invalidSlot: {
          label: 'Invalid',
        },
      },
    })

    defineSectionEditorOverlay(contentDefaultSchema, {
      meta: {
        inputConfig: {
          // @ts-expect-error invalid meta key should fail typing
          unknown_meta_key: { type: 'text' },
        },
      },
    })

    defineSectionEditorOverlay(dataListSchema, {
      slots: {
        childSections: {
          label: 'Child Sections',
          slots: {
            // Nested slot keys are intentionally string-keyed in Phase 1; recursive key inference is deferred.
            gallery: {
              label: 'Data',
              component: {} as Component,
            },
          },
        },
      },
    })

    defineSectionEditorOverlay(dataListSchema, {
      slots: {
        // @ts-expect-error invalid top-level slot key should fail typing
        gallery: {
          label: 'Invalid Top Level Gallery',
        },
      },
    })
  })
})
