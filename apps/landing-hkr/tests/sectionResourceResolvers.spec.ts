import { describe, expect, it, vi } from 'vitest'
import { sectionResourceResolvers } from '../src/lib/sections/section-resource-resolvers.server'

describe('sectionResourceResolvers.product', () => {
  it('returns null when product id meta is missing', async () => {
    const result = await sectionResourceResolvers.product({
      section: { id: 'section-1', meta: {} },
      slotKey: 'product',
      slot: {
        type: 'resource',
        source: 'product',
        order: 1,
        params: { strategy: 'detailById', idMetaField: 'product_id' },
      } as any,
      context: {
        prisma: { product: { findFirst: vi.fn() } },
        getLocale: () => 'id',
        url: new URL('https://example.test'),
      },
    })

    expect(result).toBeNull()
  })

  it('returns normalized product detail for a valid id', async () => {
    const findFirst = vi.fn().mockResolvedValue({
      name: 'Paha Ayam',
      description: 'Detail produk',
      product: {
        id: 'prod-1',
        active: true,
        product_category_id: 'cat-1',
        url: 'https://example.test/product',
        images: [{ url: 'https://example.test/1.png' }, { path: 'https://example.test/2.png' }],
        productCategory: {
          id: 'cat-1',
          active: true,
          translations: [{ name: 'Boneless' }],
        },
      },
    })

    const result = await sectionResourceResolvers.product({
      section: { id: 'section-1', meta: { product_id: 'prod-1' } },
      slotKey: 'product',
      slot: {
        type: 'resource',
        source: 'product',
        order: 1,
        params: { strategy: 'detailById', idMetaField: 'product_id' },
      } as any,
      context: {
        prisma: { productTranslation: { findFirst } },
        getLocale: () => 'id',
        url: new URL('https://example.test'),
      },
    })

    expect(findFirst).toHaveBeenCalledTimes(1)
    expect(result).toEqual({
      id: 'prod-1',
      product_category_id: 'cat-1',
      name: 'Paha Ayam',
      description: 'Detail produk',
      url: 'https://example.test/product',
      category: 'Boneless',
      thumbnail: 'https://example.test/1.png',
      images: [{ url: 'https://example.test/1.png' }, { path: 'https://example.test/2.png' }],
    })
  })

  it('returns null when product is not found', async () => {
    const result = await sectionResourceResolvers.product({
      section: { id: 'section-1', meta: { product_id: 'missing-id' } },
      slotKey: 'product',
      slot: {
        type: 'resource',
        source: 'product',
        order: 1,
        params: { strategy: 'detailById', idMetaField: 'product_id' },
      } as any,
      context: {
        prisma: { productTranslation: { findFirst: vi.fn().mockResolvedValue(null) } },
        getLocale: () => 'id',
        url: new URL('https://example.test'),
      },
    })

    expect(result).toBeNull()
  })

  it('returns empty list for non-detail strategy when many=true', async () => {
    const result = await sectionResourceResolvers.product({
      section: { id: 'section-1', meta: { product_id: 'prod-1' } },
      slotKey: 'products',
      slot: {
        type: 'resource',
        source: 'product',
        order: 1,
        many: true,
      } as any,
      context: {
        prisma: { productTranslation: { findFirst: vi.fn() } },
        getLocale: () => 'id',
        url: new URL('https://example.test'),
      },
    })

    expect(result).toEqual([])
  })
})
