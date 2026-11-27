import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { buildFrameworkCatalogs } from './generate-framework-catalog.mjs'

test('framework catalogs stay synchronized with Loom and Sprindle source exports', () => {
  const outputs = buildFrameworkCatalogs()
  const byFile = new Map(outputs.map((item) => [item.path, item.content]))
  const loomEntry = outputs.find((item) => item.path.endsWith('packages/loom/CATALOG.md'))
  const sprindleEntry = outputs.find((item) => item.path.endsWith('packages/sprindle/CATALOG.md'))

  assert.ok(loomEntry)
  assert.ok(sprindleEntry)

  assert.match(loomEntry.content, /`DetailView` \| `[^`]+`/)
  assert.match(loomEntry.content, /`DateInput` \| [^|\n]*`withTimePicker`/)
  assert.match(loomEntry.content, /`ChipFilter` \| [^|\n]*`selection`/)
  assert.match(loomEntry.content, /`invalidates`/)
  assert.match(loomEntry.content, /`runHonoMutation\(operation, request\)`/)
  assert.doesNotMatch(loomEntry.content, /\| `html` \|/)
  assert.doesNotMatch(loomEntry.content, /`ConfirmationDialogActions`/)

  assert.match(sprindleEntry.content, /`detail` \| [^|\n]*`run`/)
  assert.match(sprindleEntry.content, /`list` \| [^|\n]*`query\{defaultSort,defaultOrder,enumFilters\}`/)
  assert.match(sprindleEntry.content, /`lockRow\(db, table, id, options\?\)`/)
  assert.match(sprindleEntry.content, /`pinnedOrder`, `searchColumns`, `virtual`/)

  for (const [filePath, expected] of byFile) {
    assert.equal(readFileSync(filePath, 'utf8'), expected, `${filePath} is stale; run pnpm run catalog:generate`)
  }
})
