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
  AnyHandler,
  ResourceCapability,
  ResourceCapabilitiesDefinition,
  ResourceCapabilityKey,
  ResourceCapabilityTarget,
  NavigableResourceCapability,
  NormalizedResourceCapability,
  RegisteredResourceCapability,
  ResourceSurfaceDefinition,
  ResolvedIdentity,
  IdentityDeclarationInput,
  TableSurface,
  TableSurfaceArguments,
  DetailSurface,
  DetailSurfaceArguments,
  ResourceBase,
  ListCapableResource,
  DetailCapableResource,
} from './defineResource'
export { resourceCapabilityForRoute, resetResourceCapabilityRegistry } from './defineResource'

export { registerResourceRuntime, resetResourceRuntimeForTests, useResourceRuntime } from './runtime'
export type { ResourceRuntime } from './runtime'
