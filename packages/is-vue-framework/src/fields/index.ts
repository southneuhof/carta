export { defineFields } from './defineFields'
export type { FieldCatalogInput, CatalogKey } from './defineFields'

export { readField, readFields, writeField } from './access'

export { resolveFields, toCatalog } from './resolve'
export type { FieldSurface, FieldLayer, ResolvedSurfaceField, FieldResolutionOptions } from './resolve'

export { createBehaviorRuntime, assertBehavior } from './behavior'
export type { BehaviorRuntime, BehaviorRuntimeOptions, FieldBehaviorState } from './behavior'
