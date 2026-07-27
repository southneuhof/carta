export { defineResource } from './defineResource'
export type {
  Resource,
  ResourceDefinition,
  ResourceOperations,
  ResourceCapabilities,
  ResourceAction,
  ResourceActionDefinition,
  ResourceActionKey,
  ResourceActionTarget,
  NavigableResourceAction,
  ResourceSurfaceDefinition,
  ResolvedIdentity,
  IdentityDeclarationInput,
  TableSurface,
  TableSurfaceArguments,
  DetailSurface,
  DetailSurfaceArguments,
} from './defineResource'
export { resourceActionForRoute, resetResourceActionRegistry } from './defineResource'

/**
 * `standardControls` is internal: the surface factories return the projection
 * already applied. Only its customization types are public.
 */
export type { StandardControlName, ControlOverride, ControlsArguments, ActionableControl } from './controls'

export { registerResourceRuntime, resetResourceRuntimeForTests, useResourceRuntime } from './runtime'
export type { ResourceRuntime } from './runtime'
