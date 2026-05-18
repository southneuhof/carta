import contentDefaultSchema from '@southneuhof/landing-section-schema/sections/content-default'
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
  })
})
