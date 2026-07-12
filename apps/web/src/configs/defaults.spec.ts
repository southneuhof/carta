import { describe, expect, it } from 'vitest'
import { appDefaults } from './defaults'

describe('app defaults', () => {
  it('owns complete web defaults', () => {
    expect(appDefaults.global?.fieldsAlias?.name).toBe('Nama')
    expect(appDefaults.global?.fieldsProxy?.created_by).toBe('rel_created_by')
    expect(appDefaults.global?.inputConfig?.email?.props?.validation?.safeParse?.('bad')?.success).toBe(false)
    expect(appDefaults.global?.fieldsType?.status_code?.props?.options.expired.label).toBe('Kadaluwarsa')
    expect(appDefaults.table?.fieldsAlias).toBeUndefined()
    expect(appDefaults.table?.fieldsClass?.description).toContain('line-clamp-3')
    expect(appDefaults.table?.fieldsAlign?.status_code).toBe('center')
    expect(appDefaults.detail?.fieldsAlias).toBeUndefined()
    expect(appDefaults.detail?.fieldsType?.array_clauses).toEqual({ type: 'array-clauses' })
    expect(appDefaults.form?.fieldsAlias).toBeUndefined()
    expect(appDefaults.form?.inputConfig?.status_code?.props?.data).toEqual([
      { name: 'Aktif', id: 'active' },
      { name: 'Nonaktif', id: 'non_active' },
    ])
  })
})
