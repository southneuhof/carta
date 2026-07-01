import type { AliasOptions } from 'vite'

export function createWorkspacePackageAliases(): AliasOptions
export function createProviderSourceAliases(): AliasOptions
export function createPortablePackageAliases(): AliasOptions
export const clientPackages: Record<string, string>
export const providerPackages: Record<string, string>
