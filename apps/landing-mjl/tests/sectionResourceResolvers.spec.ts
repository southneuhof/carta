import { describe, expect, it, vi } from 'vitest'
import { sectionResourceResolvers } from '../src/lib/sections/section-resource-resolvers.server'

describe('sectionResourceResolvers.form-template', () => {
  it('returns empty template when form type id meta is missing', async () => {
    const result = await sectionResourceResolvers['form-template']({
      section: { id: 'section-1', meta: {} },
      slotKey: 'formDataTemplate',
      slot: {
        type: 'resource',
        source: 'form-template',
        order: 1,
        params: { formTypeMetaField: 'form_type_id' },
      } as any,
      context: {
        prisma: { formField: { findMany: vi.fn() } },
        getLocale: () => 'id',
        url: new URL('https://example.test'),
      },
    })

    expect(result).toEqual({
      form_type_id: '',
      data: [],
    })
  })

  it('returns template shaped for FormView', async () => {
    const findMany = vi.fn().mockResolvedValue([
      { id: 'field-1', form_type_id: 'ft-1', code: 'name', order: 1, type: 'text' },
      { id: 'field-2', form_type_id: 'ft-1', code: 'email', order: 2, type: 'text' },
    ])

    const result = await sectionResourceResolvers['form-template']({
      section: { id: 'section-1', meta: { form_type_id: 'ft-1' } },
      slotKey: 'formDataTemplate',
      slot: {
        type: 'resource',
        source: 'form-template',
        order: 1,
        params: { formTypeMetaField: 'form_type_id' },
      } as any,
      context: {
        prisma: { formField: { findMany } },
        getLocale: () => 'id',
        url: new URL('https://example.test'),
      },
    })

    expect(findMany).toHaveBeenCalledTimes(1)
    expect(result).toEqual({
      form_type_id: 'ft-1',
      data: [
        { id: 'field-1', form_type_id: undefined, code: 'name', order: 1, type: 'text', value: undefined },
        { id: 'field-2', form_type_id: undefined, code: 'email', order: 2, type: 'text', value: undefined },
      ],
    })
  })
})

describe('sectionResourceResolvers.article-category', () => {
  it('returns localized article categories', async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        id: 'cat-1',
        code: 'news',
        translations: [{ name: 'Berita' }],
      },
      {
        id: 'cat-2',
        code: 'insight',
        translations: [{ name: 'Insight' }],
      },
    ])

    const result = await sectionResourceResolvers['article-category']({
      section: { id: 'section-1', meta: {} },
      slotKey: 'articleCategory',
      slot: {
        type: 'resource',
        source: 'article-category',
        order: 1,
      } as any,
      context: {
        prisma: { articleCategory: { findMany } },
        getLocale: () => 'id',
        url: new URL('https://example.test'),
      },
    })

    expect(findMany).toHaveBeenCalledTimes(1)
    expect(result).toEqual([
      { id: 'cat-1', code: 'news', name: 'Berita', translations: undefined },
      { id: 'cat-2', code: 'insight', name: 'Insight', translations: undefined },
    ])
  })

  it('handles missing translations safely', async () => {
    const result = await sectionResourceResolvers['article-category']({
      section: { id: 'section-1', meta: {} },
      slotKey: 'articleCategory',
      slot: {
        type: 'resource',
        source: 'article-category',
        order: 1,
      } as any,
      context: {
        prisma: {
          articleCategory: {
            findMany: vi.fn().mockResolvedValue([
              { id: 'cat-1', code: 'news', translations: [] },
            ]),
          },
        },
        getLocale: () => 'id',
        url: new URL('https://example.test'),
      },
    })

    expect(result).toEqual([
      { id: 'cat-1', code: 'news', name: '', translations: undefined },
    ])
  })

  it('returns empty list when no categories exist', async () => {
    const result = await sectionResourceResolvers['article-category']({
      section: { id: 'section-1', meta: {} },
      slotKey: 'articleCategory',
      slot: {
        type: 'resource',
        source: 'article-category',
        order: 1,
      } as any,
      context: {
        prisma: {
          articleCategory: {
            findMany: vi.fn().mockResolvedValue([]),
          },
        },
        getLocale: () => 'id',
        url: new URL('https://example.test'),
      },
    })

    expect(result).toEqual([])
  })
})

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

describe('sectionResourceResolvers.job', () => {
  it('returns localized active jobs sorted by order', async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        id: 'job-1',
        order: 1,
        jobCategory: {
          active: true,
          translations: [{ name: 'SALES' }],
        },
        translations: [{ name: 'Staff', minimum_education: 'S1', location: 'Semarang' }],
      },
      {
        id: 'job-2',
        order: 2,
        jobCategory: {
          active: true,
          translations: [{ name: 'FINANCE STAFF' }],
        },
        translations: [{ name: 'Operator', minimum_education: 'D3', location: 'Bandung' }],
      },
    ])

    const result = await sectionResourceResolvers.job({
      section: { id: 'section-1', meta: {} },
      slotKey: 'jobs',
      slot: {
        type: 'resource',
        source: 'job',
        order: 1,
        many: true,
        params: { strategy: 'activeList' },
      } as any,
      context: {
        prisma: { job: { findMany } },
        getLocale: () => 'id',
        url: new URL('https://example.test'),
      },
    })

    expect(findMany).toHaveBeenCalledTimes(1)
    expect(result).toEqual([
      { id: 'job-1', name: 'Staff', minimum_education: 'S1', location: 'Semarang', category: 'SALES' },
      { id: 'job-2', name: 'Operator', minimum_education: 'D3', location: 'Bandung', category: 'FINANCE STAFF' },
    ])
  })

  it('filters out inactive category and incomplete localized data', async () => {
    const result = await sectionResourceResolvers.job({
      section: { id: 'section-1', meta: {} },
      slotKey: 'jobs',
      slot: {
        type: 'resource',
        source: 'job',
        order: 1,
        many: true,
        params: { strategy: 'activeList' },
      } as any,
      context: {
        prisma: {
          job: {
            findMany: vi.fn().mockResolvedValue([
              {
                id: 'job-1',
                jobCategory: { active: false, translations: [{ name: 'TECHNICAL SUPPORT' }] },
                translations: [{ name: 'Staff', minimum_education: 'S1', location: 'Solo' }],
              },
              {
                id: 'job-2',
                jobCategory: { active: true, translations: [{ name: 'TECHNICAL SUPPORT' }] },
                translations: [{ name: '', minimum_education: 'S1', location: 'Solo' }],
              },
            ]),
          },
        },
        getLocale: () => 'id',
        url: new URL('https://example.test'),
      },
    })

    expect(result).toEqual([])
  })

  it('returns empty list for unsupported strategy when many=true', async () => {
    const result = await sectionResourceResolvers.job({
      section: { id: 'section-1', meta: {} },
      slotKey: 'jobs',
      slot: {
        type: 'resource',
        source: 'job',
        order: 1,
        many: true,
        params: { strategy: 'detailById' },
      } as any,
      context: {
        prisma: { job: { findMany: vi.fn() } },
        getLocale: () => 'id',
        url: new URL('https://example.test'),
      },
    })

    expect(result).toEqual([])
  })
})
