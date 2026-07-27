import { describe, expect, it } from 'vitest'
import * as framework from '../index'

/**
 * Locks the 2.0 public surface after the clean break.
 *
 * Release policy (decided 2026-07-26, verified before deletion): the package
 * has no consumers outside this monorepo — its `exports` map points at raw
 * `src` and it carries no `publishConfig`, and the private registry could not
 * be queried without credentials — so the legacy CRUD surface was removed
 * outright under a major version bump rather than deprecated.
 */
const removedExports = [
  // Folded into the surface factories by plan 027; never public API again.
  'standardControls',
  'resolveCRUDOperations',
  'useCRUDOperations',
  'defaultCRUDListOnExport',
  'defaultCRUDDetailOnExport',
]

const currentExports = [
  'FrameworkPlugin',
  'defineFields',
  'resolveFields',
  'createBehaviorRuntime',
  'defineResource',
  'Table',
  'Detail',
  'Form',
  'ListView',
  'DetailView',
  'FormView',
  'fromZod',
  'selectSchema',
  'validateDraft',
  'useLoader',
  'useNamespacedQuery',
  'createFrameworkQueryClient',
  'invalidateResourceData',
  'createRendererRegistries',
  'resolveFrameworkAdapters',
]

describe('public API surface', () => {
  it('exports the resource, core, and shell surface', () => {
    for (const name of currentExports) expect(framework, `missing export: ${name}`).toHaveProperty(name)
  })

  it('no longer exports the retired CRUD surface', () => {
    for (const name of removedExports) expect(framework, `unexpected export: ${name}`).not.toHaveProperty(name)
  })

  it('keeps the runtime free of CRUD capability groups', async () => {
    const runtime = await import('../runtime')

    expect(Object.keys(runtime)).not.toContain('FrameworkCRUDRuntime')
  })
})
