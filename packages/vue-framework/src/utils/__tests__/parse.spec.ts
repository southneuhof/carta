import { afterEach, describe, expect, it } from 'vitest'
import { configureParser, createParser, parse, resetParserConfigForTests } from '../parse'

describe('parse utilities', () => {
  afterEach(() => {
    resetParserConfigForTests()
  })

  it('formats built-in formatter keys by default', () => {
    expect(parse('number', 1234)).toBe('1.234')
    expect(parse('delta', 3)).toBe('+3.00%')
    expect(parse('hour', '2026-05-14 09:30')).toBe('09:30')
  })

  it('configures dictionary values for the shared parser', () => {
    configureParser({
      dictionary: {
        active: {
          Y: 'Aktif',
          N: 'Nonaktif',
        },
      },
    })

    expect(parse('active', 'Y')).toBe('Aktif')
  })

  it('allows app formatter overrides to replace default formatter behavior', () => {
    configureParser({
      formatters: {
        number: (value) => `custom:${value}`,
      },
    })

    expect(parse('number', 12)).toBe('custom:12')
  })

  it('falls back to dictionary values for unknown formatter keys', () => {
    const localParse = createParser({
      dictionary: {
        status: {
          pending: 'Pending',
        },
      },
    })

    expect(localParse('status', 'pending')).toBe('Pending')
  })

  it('returns raw values for unknown keys without dictionary matches', () => {
    expect(parse('missing', 'raw')).toBe('raw')
  })

  it('resets shared parser configuration for tests', () => {
    configureParser({
      dictionary: {
        active: {
          Y: 'Aktif',
        },
      },
    })

    resetParserConfigForTests()

    expect(parse('active', 'Y')).toBe('Y')
  })
})
