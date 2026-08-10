import { describe, expect, it } from 'vitest'
import { normalizeProjectListQuery } from './projects'

describe('project list filters', () => {
  it('maps legacy project tabs to the current list columns', () => {
    expect(normalizeProjectListQuery({ statusCode: 'completed', implementationStatusCode: 'on-progress' })).toEqual({ active: true })
    expect(normalizeProjectListQuery({ statusCode: 'completed', implementationStatusCode: 'finished' })).toEqual({ active: false })
    expect(normalizeProjectListQuery({ statusCode: 'draft' })).toEqual({ statusCode: 'draft' })
  })

  it('coerces the direct active filter from its query-string value', () => {
    expect(normalizeProjectListQuery({ active: 'true' })).toEqual({ active: true })
    expect(normalizeProjectListQuery({ active: 'false' })).toEqual({ active: false })
  })
})
