import { afterEach, describe, expect, it } from 'vitest'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

const createdDirs: string[] = []

afterEach(async () => {
  await Promise.all(createdDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

describe('publicAssetManager path constraints', () => {
  it('rejects private and traversal paths', async () => {
    const { normalizePublicStoragePath } = await import('../src/lib/files/publicAssetManager')

    expect(() => normalizePublicStoragePath('/storage/private/a.txt')).toThrow('Only /storage/public')
    expect(() => normalizePublicStoragePath('/storage/public/../../private/a.txt')).toThrow('Path traversal')
  })

  it('lists folders and files in stable shape', async () => {
    const testRootName = `__asset_manager_test_${randomUUID()}`
    const storageRoot = join(process.cwd(), 'storage', 'public', testRootName)
    createdDirs.push(storageRoot)

    await mkdir(join(storageRoot, 'docs'), { recursive: true })
    await writeFile(join(storageRoot, 'a.txt'), 'a')

    const { listPublicAssets } = await import('../src/lib/files/publicAssetManager')
    const items = await listPublicAssets({ dir: `/storage/public/${testRootName}`, sort_by: 'filename', sort: 'asc' })

    expect(items.length).toBe(2)
    expect(items[0]?.type).toBe('folder')
    expect(items[0]?.path).toBe(`/storage/public/${testRootName}/docs`)
    expect(items[1]?.type).toBe('file')
    expect(items[1]?.filename).toBe('a.txt')
    expect(items[1]?.content_type).toBe('text/plain')
  })
})
