export { defineResource, defineResourceOperations } from './defineResource'
export type {
  Resource,
  ResourceDefinition,
  ResourceOperations,
  ResourceOperationKey,
  ResourceOperationKeys,
  ResourceRecordOf,
  ResourceQueryOf,
  ResourceCreateOf,
  ResourceUpdateOf,
  ResourceIdentityOf,
  ResourceAction,
  ResourceActionsDefinition,
  ResourceActionDefinition,
  ResourceActionKey,
  ResourceActionTarget,
  NavigableResourceAction,
  ResourceSurfaceDefinition,
  ResolvedIdentity,
  IdentityDeclarationInput,
  TableSurface,
  TableSurfaceArguments,
  RowAction,
  DetailSurface,
  DetailSurfaceArguments,
  ResourceBase,
  ListCapableResource,
  DetailCapableResource,
} from './defineResource'
export { resourceActionForRoute, resetResourceActionRegistry } from './defineResource'

export { registerResourceRuntime, resetResourceRuntimeForTests, useResourceRuntime } from './runtime'
export type { ResourceRuntime } from './runtime'
