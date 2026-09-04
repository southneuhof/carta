import { describe, expect, it } from 'vitest'
import { timestampField } from './presets'

describe('field presets', () => {
  it('keeps timestamp labels explicit while sharing exact metadata', () => {
    expect(timestampField('Dibuat')).toEqual({
      label: 'Dibuat',
      display: { format: 'datetime' },
      form: false,
    })
  })
})
