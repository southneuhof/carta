import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { appInputProps } from './registry'

const list = () => Promise.resolve({ data: [] })
const detail = () => Promise.resolve({ id: 'x' })
const resource = { key: 'sections', fields: { name: {} }, capabilities: { list: { handler: list }, detail: { handler: detail } } }

describe('app input props registry', () => {
  it('resolves lookup capabilities and keeps explicit overrides', () => {
    expect(appInputProps.resolve('lookup', {
      source: resource,
      props: { searchParameters: { private: true } },
    })).toEqual({ fields: resource.fields, load: list, loadDetail: detail, namespace: 'sections', searchParameters: { private: true } })
  })

  it('maps arrays to data and never emits source', () => {
    const data = [{ id: 'active', name: 'Aktif' }]
    expect(appInputProps.resolve('radio', { source: data })).toEqual({ data })
  })

  it('shares stable file and image defaults', () => {
    expect(appInputProps.resolve('file', {}).upload).toBe(appInputProps.resolve('image', {}).upload)
  })

  it('keeps the runtime registry out of production field declarations', () => {
    const defaults = readFileSync(resolve(process.cwd(), 'src/configs/defaults.ts'), 'utf8')

    expect(defaults).not.toContain('appInputProps')
  })
})
