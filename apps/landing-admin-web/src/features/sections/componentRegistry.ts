import type { Component } from 'vue'

export const sectionEditorComponentRegistry = {
  // 'custom-token': ImportedComponent,
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
