import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { basename, dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = join(dirname(fileURLToPath(import.meta.url)), '../..')
const routesRoot = join(appRoot, 'routes/(authenticated)')
const retiredResourcesRoot = join(appRoot, 'framework/adapters/resources')

function collectFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry)
    if (statSync(path).isDirectory()) return collectFiles(path)
    return /\.(ts|vue)$/.test(path) ? [path] : []
  })
}

const routeFiles = collectFiles(routesRoot)
const resourceFiles = routeFiles.filter((path) => path.endsWith('.resource.ts'))
const operationFiles = routeFiles.filter((path) => path.endsWith('.operations.ts'))

describe('route-owned resource boundaries', () => {
  it('keeps each migrated resource and operation at its canonical route owner', () => {
    const required = [
      'settings/roles/roles.resource.ts',
      'settings/roles/[roleId]/detail/permissions/role-permissions.resource.ts',
      'settings/permissions/permissions.resource.ts',
      'settings/users/users.resource.ts',
      'settings/users/[userId]/detail/system-roles/system-role-assignments.resource.ts',
      'to-do/notifications.resource.ts',
      'master-data/projects/[projectId]/detail/vendors/project-vendors.resource.ts',
    ]

    expect(required.filter((path) => !existsSync(join(routesRoot, path)))).toEqual([])
    expect(existsSync(retiredResourcesRoot)).toBe(false)
  })

  it('keeps resource declarations transport-free and operations framework-view-free', () => {
    const resourceOffenders = resourceFiles.filter((path) => /\.\$(get|post|patch|delete)\b/.test(readFileSync(path, 'utf8')))
    const operationOffenders = operationFiles.filter((path) => /from ['"](?:vue|vue-router|vue-sonner|@\/components\b)/.test(readFileSync(path, 'utf8')))

    expect(resourceOffenders.map((path) => relative(appRoot, path))).toEqual([])
    expect(operationOffenders.map((path) => relative(appRoot, path))).toEqual([])
  })

  it('keeps raw RPC calls out of migrated route components and route folders barrel-free', () => {
    const routeRpcOffenders = routeFiles.filter((path) => path.endsWith('.route.vue')).filter((path) => /from ['"]@\/framework\/rpc['"]|\brpc\./.test(readFileSync(path, 'utf8')))
    const barrels = routeFiles.filter((path) => basename(path) === 'index.ts')

    expect(routeRpcOffenders.map((path) => relative(appRoot, path))).toEqual([])
    expect(barrels.map((path) => relative(appRoot, path))).toEqual([])
  })

  it('removes retired transport mirrors', () => {
    const applicationFiles = collectFiles(appRoot).filter((path) => !/\.(spec|type-test)\.ts$/.test(path))
    const source = applicationFiles.map((path) => readFileSync(path, 'utf8')).join('\n')
    const forbidden = new RegExp(
      [
        ['Rpc', 'CRUDRoute'],
        ['Async', 'Function'],
        ['as unknown as ', 'Rpc'],
        ['create', 'RpcOperations'],
        ['parse', 'RpcResponse<'],
        ['Resource', 'Capabilities'],
        ['Role', 'Query'],
        ['User', 'Query'],
        ['Notification', 'Query'],
        ['User', 'Draft'],
        ['Assignable', 'Role'],
      ]
        .map((term) => term.join(''))
        .join('|')
    )

    expect(source.match(forbidden)).toBeNull()
  })

  it('keeps type-check in the package build gate', () => {
    const packageJson = JSON.parse(readFileSync(join(appRoot, '../package.json'), 'utf8')) as { scripts: Record<string, string> }

    expect(packageJson.scripts.build).toBe('run-s type-check build-only')
  })
})
