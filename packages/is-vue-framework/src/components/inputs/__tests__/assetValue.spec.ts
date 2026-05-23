import { describe, expect, it } from 'vitest'
import { normalizeFileAssetValue } from '../assetValue'

describe('file asset value normalization', () => {
  it('normalizes file-manager upload response objects', () => {
    expect(normalizeFileAssetValue({
      type: 'file',
      path: '/storage/public/a.jpg',
      url: 'https://landing.test/storage/public/a.jpg',
      filename: 'a.jpg',
      size: 12,
      content_type: 'image/jpeg',
      updated_at: '2026-01-01T00:00:00.000Z',
      data: '/storage/public/a.jpg',
    })).toEqual({
      type: 'file',
      path: '/storage/public/a.jpg',
      data: '/storage/public/a.jpg',
      url: 'https://landing.test/storage/public/a.jpg',
      filename: 'a.jpg',
      size: 12,
      content_type: 'image/jpeg',
      updated_at: '2026-01-01T00:00:00.000Z',
    })
  })

  it('normalizes file-manager list items', () => {
    expect(normalizeFileAssetValue({
      type: 'file',
      path: '/storage/public/docs/a.pdf',
      url: '/storage/public/docs/a.pdf',
      filename: 'a.pdf',
      size: 20,
      content_type: 'application/pdf',
    })).toMatchObject({
      type: 'file',
      path: '/storage/public/docs/a.pdf',
      data: '/storage/public/docs/a.pdf',
      filename: 'a.pdf',
      content_type: 'application/pdf',
    })
  })

  it('normalizes legacy path/data/url-only responses', () => {
    expect(normalizeFileAssetValue({ data: 'https://old.test/storage/public/b.png' })).toMatchObject({
      type: 'file',
      path: '/storage/public/b.png',
      data: '/storage/public/b.png',
      url: '/storage/public/b.png',
      filename: 'b.png',
      content_type: 'image/png',
    })
  })

  it('falls back metadata from path and filename', () => {
    expect(normalizeFileAssetValue('/storage/public/report.pdf')).toMatchObject({
      type: 'file',
      path: '/storage/public/report.pdf',
      data: '/storage/public/report.pdf',
      filename: 'report.pdf',
      content_type: 'application/pdf',
      size: 0,
    })
  })
})
