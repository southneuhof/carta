import { describe, expect, it } from 'vitest'
import { parseOvertimeFilters, scopeConditions } from './overtimes.source'

describe('overtime list filters', () => {
  it('accepts the canonical filter matrix and ignores empty values', () => {
    expect(parseOvertimeFilters({
      sectionId: 'section-1',
      applicantEmployeeId: 'employee-1',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      jobPositionId: 'position-1',
      statusCode: 'waiting',
      search: 'repair',
      page: 1,
      limit: 20,
      order: 'asc',
    })).toEqual({
      sectionId: 'section-1',
      applicantEmployeeId: 'employee-1',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      jobPositionId: 'position-1',
      statusCode: 'waiting',
    })
  })

  it('rejects unknown filters, invalid dates, reversed ranges, and statuses', () => {
    expect(() => parseOvertimeFilters({ rawColumn: 'x' })).toThrow('Unknown overtime filter')
    expect(() => parseOvertimeFilters({ startDate: '07/01/2026' })).toThrow('YYYY-MM-DD')
    expect(() => parseOvertimeFilters({ startDate: '2026-08-01', endDate: '2026-07-01' })).toThrow('must not be after')
    expect(() => parseOvertimeFilters({ statusCode: 'cancelled' })).toThrow('Unknown overtime status')
  })

  it('keeps narrow identities section-scoped and unplaced identities denied', () => {
    expect(scopeConditions({ scope: 'section', sectionId: 'section-1' } as never)).toEqual([{ sectionId: 'section-1' }])
    expect(scopeConditions({ scope: 'section' } as never)).toEqual([{ id: { isNull: true } }])
    expect(scopeConditions({ scope: 'all' } as never)).toEqual([])
  })
})
