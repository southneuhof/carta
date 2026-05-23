import { afterEach, describe, expect, it, vi } from 'vitest'
import { mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { listPublicAssets } from '../src/lib/files/publicAssetManager'

const createdDirs: string[] = []
const manifestRows = new Map<string, any>()

vi.mock('$lib/utils/routing', () => ({
  isBypassAllPermissionsEnabled: () => true,
  requireAuthenticatedUser: vi.fn(),
}))

vi.mock('$lib/utils/prisma', () => ({
  default: {
    imageManifest: {
      async findUnique({ where }: any) {
        return manifestRows.get(where.original_path) ?? null
      },
      async upsert({ where, create, update }: any) {
        const current = manifestRows.get(where.original_path)
        const row = {
          id: current?.id ?? randomUUID(),
          original_path: where.original_path,
          created_at: current?.created_at ?? new Date(),
          updated_at: new Date(),
          ...(current ? update : create),
        }
        manifestRows.set(where.original_path, row)
        return row
      },
      async delete({ where }: any) {
        manifestRows.delete(where.original_path)
      },
    },
  },
}))

afterEach(async () => {
  manifestRows.clear()
  await Promise.all(createdDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

async function uploadFile(file: File, dir: string) {
  const { POST } = await import('../src/routes/api/files/upload/+server')
  const formData = new FormData()
  formData.set('file', file)
  formData.set('dir', dir)

  return POST({
    locals: {},
    request: new Request('http://localhost/api/files/upload', {
      method: 'POST',
      body: formData,
    }),
  } as any)
}

describe('/api/files/upload optimization', () => {
  it('optimizes uploaded public images and exposes an image manifest', async () => {
    const testRootName = `__optimized_upload_${randomUUID()}`
    const storageRoot = join(process.cwd(), 'storage', 'public', testRootName)
    createdDirs.push(storageRoot)
    await mkdir(storageRoot, { recursive: true })

    const imageBytes = await sharp({
      create: {
        width: 96,
        height: 48,
        channels: 3,
        background: '#3366ff',
      },
    }).jpeg().toBuffer()

    const response = await uploadFile(new File([new Uint8Array(imageBytes)], 'photo.jpg', { type: 'image/jpeg' }), `/storage/public/${testRootName}`)
    expect(response.status).toBe(200)

    const payload = await response.json()
    expect(payload.data.path).toMatch(new RegExp(`^/storage/public/${testRootName}/\\d+-photo\\.jpg$`))
    expect(payload.data.content_type).toBe('image/jpeg')
    expect(payload.data.size).toBeGreaterThan(0)

    const manifestPath = payload.data.path.replace(/^\//, '')
    const { GET } = await import('../src/routes/api/image/manifest/[...path]/+server')
    const manifestResponse = await GET({ params: { path: manifestPath } } as any)
    expect(manifestResponse.status).toBe(200)

    const manifest = await manifestResponse.json()
    expect(manifest.placeholder).toMatch(/^data:image\/webp;base64,/)
    expect(manifest.variants.length).toBeGreaterThan(0)
    expect(manifest.variants[0].url).toContain('/storage/public/')
  })

  it('uploads non-images unchanged and keeps them listable', async () => {
    const testRootName = `__plain_upload_${randomUUID()}`
    const storageRoot = join(process.cwd(), 'storage', 'public', testRootName)
    createdDirs.push(storageRoot)
    await mkdir(storageRoot, { recursive: true })

    const response = await uploadFile(new File(['hello'], 'document.txt', { type: 'text/plain' }), `/storage/public/${testRootName}`)
    expect(response.status).toBe(200)

    const payload = await response.json()
    expect(payload.data.path).toMatch(new RegExp(`^/storage/public/${testRootName}/\\d+-document\\.txt$`))
    expect(payload.data.content_type).toBe('text/plain')
    expect(manifestRows.size).toBe(0)

    const items = await listPublicAssets({ dir: `/storage/public/${testRootName}` })
    expect(items).toHaveLength(1)
    expect(items[0]?.filename).toBe(payload.data.filename)
  })

  it('rejects private and traversal upload directories', async () => {
    const privateResponse = await uploadFile(new File(['x'], 'x.txt', { type: 'text/plain' }), '/storage/private')
    expect(privateResponse.status).toBe(400)

    const traversalResponse = await uploadFile(new File(['x'], 'x.txt', { type: 'text/plain' }), '/storage/public/../private')
    expect(traversalResponse.status).toBe(400)
  })
})
