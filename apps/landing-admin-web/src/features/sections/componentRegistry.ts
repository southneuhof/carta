import type { Component } from 'vue'
import ProductShowcaseMetaEditor from '@/views/authenticated/website/website/_layouts/detail/_layouts/_layouts/_layouts/_Custom/ProductShowcaseMetaEditor.vue'

export const sectionEditorComponentRegistry = {
  'product-showcase-meta-editor': ProductShowcaseMetaEditor,
} satisfies Record<string, Component>

export function resolveSectionEditorComponent(token?: string): Component | undefined {
  if (!token) return undefined
  const resolved = sectionEditorComponentRegistry[token]

  if (!resolved) {
    const message = `[sections] Unknown section editor component token: "${token}"`
    if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
      throw new Error(message)
    }
    console.warn(message)
    return undefined
  }

  return resolved
}
