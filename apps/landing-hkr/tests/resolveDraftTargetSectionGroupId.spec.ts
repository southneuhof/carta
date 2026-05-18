import { describe, expect, it } from 'vitest'
import { resolveDraftTargetSectionGroupId } from '../src/routes/api/sectionGroup/addSection/resolveDraftTargetSectionGroupId'

describe('resolveDraftTargetSectionGroupId', () => {
  it('returns submitted sectionGroupId when idMap is null', () => {
    expect(
      resolveDraftTargetSectionGroupId({
        sectionGroupId: 'nested-group-id',
        idMap: null,
      }),
    ).toBe('nested-group-id')
  })

  it('returns mapped sectionGroupId when idMap contains submitted id', () => {
    expect(
      resolveDraftTargetSectionGroupId({
        sectionGroupId: 'source-group-id',
        idMap: new Map([['source-group-id', 'draft-group-id']]),
      }),
    ).toBe('draft-group-id')
  })

  it('throws when idMap exists but does not contain submitted id', () => {
    expect(() =>
      resolveDraftTargetSectionGroupId({
        sectionGroupId: 'missing-source-id',
        idMap: new Map([['other-source-id', 'other-draft-id']]),
      }),
    ).toThrow('Target section group was not copied into the draft')
  })
})
