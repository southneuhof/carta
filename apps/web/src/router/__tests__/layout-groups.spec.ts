import { describe, expect, it } from 'vitest'
import { staticRouteName } from '../file-routing/names'

describe('mechanical file route names', () => {
  it('omits groups, indexes, and dynamic segments', () => {
    const root = { value: { rawSegment: '(authenticated)' } } as any
    const roles = { value: { rawSegment: 'roles' }, parent: { value: { rawSegment: 'settings' }, parent: root } } as any
    const detail = { value: { rawSegment: 'detail' }, parent: { value: { rawSegment: '[roleId]' }, parent: roles } } as any
    expect(staticRouteName(detail)).toBe('settings-roles-detail')
  })
})
