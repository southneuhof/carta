import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
vi.hoisted(() => {
  vi.stubEnv('VITE_API_URL', 'https://api.test/')
})
import { appInputProps } from './registry'

const list = () => Promise.resolve({ data: [] })
const detail = () => Promise.resolve({ id: 'x' })
const resource = {
  key: 'sections',
  list: () => ({ run: list, fields: { name: {} } }),
  detail: () => ({ run: detail }),
}

describe('app input props registry', () => {
  it('resolves lookup actions and keeps explicit overrides', async () => {
    const resolved = appInputProps.resolve('lookup', {
      source: resource,
      props: { searchParameters: { private: true } },
    })
    expect(resolved).toMatchObject({ fields: resource.list().fields, load: list, namespace: 'sections', searchParameters: { private: true } })
    const loadDetail = resolved.loadDetail as (context: { id: string }) => Promise<unknown>
    await expect(loadDetail({ id: 'x' })).resolves.toEqual({ id: 'x' })
  })

  it('maps arrays to data and never emits source', () => {
    const data = [{ id: 'active', name: 'Aktif' }]
    expect(appInputProps.resolve('radio', { source: data })).toEqual({ data })
  })

  it('shares stable file and image defaults', () => {
    expect(appInputProps.resolve('file', {}).upload).toBe(appInputProps.resolve('image', {}).upload)
  })

  it('resolves image preview URLs from storage keys', () => {
    const resolve = appInputProps.resolve('image', {}).imageURLResolver as (payload: unknown) => { imageURL: string; thumbnailURL: string }
    expect(resolve({ path: 'uploads/a.png' })).toEqual({
      imageURL: 'https://api.test/files/object?key=uploads%2Fa.png',
      thumbnailURL: 'https://api.test/files/object?key=uploads%2Fa.png',
    })
  })

  it('keeps the runtime registry out of production field declarations', () => {
    const defaults = readFileSync(resolve(process.cwd(), 'src/configs/defaults.ts'), 'utf8')

    expect(defaults).not.toContain('appInputProps')
  })
})
