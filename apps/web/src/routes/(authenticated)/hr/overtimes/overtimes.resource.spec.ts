import { describe, expect, it, vi } from 'vitest'

const ok = (payload: unknown) => ({ ok: true, json: async () => payload })

const submitPost = vi.fn(async () => ok({ data: { id: 'o1', statusCode: 'waiting' } }))
const verifyPost = vi.fn(async () => ok({ data: { id: 'o1', statusCode: 'approved' } }))
const stepsGet = vi.fn(async () => ok({ data: [{ id: 's1', orderNumber: 1, statusCode: 'waiting' }], total: 1 }))
const detailGet = vi.fn(async () => ok({ data: { id: 'o1', statusCode: 'draft' } }))
const tollSectionsListGet = vi.fn(async () => ok({ data: [{ id: 'north', name: 'North' }], page: 1, limit: 20, total: 1 }))
const tollSectionsDetailGet = vi.fn(async () => ok({ data: { id: 'north', name: 'North' } }))
const applicantsListGet = vi.fn(async () => ok({ data: [{ id: 'e1', fullName: 'Budi', sectionId: 'north' }], page: 1, limit: 20, total: 1 }))
const applicantsDetailGet = vi.fn(async () => ok({ data: { id: 'e1', fullName: 'Budi', sectionId: 'north' } }))
const jobPositionsListGet = vi.fn(async () => ok({ data: [{ id: 'p1', name: 'Officer' }], page: 1, limit: 20, total: 1 }))
const jobPositionsDetailGet = vi.fn(async () => ok({ data: { id: 'p1', name: 'Officer' } }))

vi.mock('@/framework/rpc', () => ({
  rpc: {
    overtimes: {
      list: { $get: vi.fn(async () => ok({ data: [], total: 0, limit: 20 })) },
      detail: { ':id': { $get: detailGet } },
      create: { $post: vi.fn(async () => ok({ data: { id: 'o1' } })) },
      update: { ':id': { $patch: vi.fn(async () => ok({ data: { id: 'o1' } })) } },
      submit: { ':id': { $post: submitPost } },
      verify: { ':id': { $post: verifyPost } },
      steps: { ':id': { $get: stepsGet } },
      applicants: {
        list: { $get: applicantsListGet },
        detail: { ':id': { $get: applicantsDetailGet } },
      },
    },
    'toll-sections': {
      list: { $get: tollSectionsListGet },
      detail: { ':id': { $get: tollSectionsDetailGet } },
    },
    'job-positions': {
      list: { $get: jobPositionsListGet },
      detail: { ':id': { $get: jobPositionsDetailGet } },
    },
  },
}))

const { overtimes, overtimeFields, overtimeListFilters } = await import('./overtimes.resource')
const { tollSections, applicants, jobPositions } = await import('./overtime-lookups.resource')
const { tollSectionOperations, applicantOperations, jobPositionOperations } = await import('./overtime-lookups.operations')
const { verificationSteps } = await import('./[overtimeId]/verification-steps.resource')
const { submitOvertime, verifyOvertime, loadOvertime } = await import('./[overtimeId]/overtime-workflow.operations')

describe('overtimes resource', () => {
  it('declares mechanical route targets in capabilities', () => {
    expect(overtimes.capabilities.list).toMatchObject({ permission: 'overtimes.list', to: { name: 'hr-overtimes' } })
    const detailTarget = overtimes.capabilities.detail?.to
    expect(detailTarget?.params('o1')).toEqual({ overtimeId: 'o1' })
    expect(overtimes.table().canDelete).toBeUndefined()
  })
  it('shows parity fields while keeping status off the form', () => {
    // API still overwrites applicant and section from authenticated identity.
    const formFields = Object.keys(overtimes.form().fields as Record<string, unknown>)
    expect(formFields).toEqual(['sectionId', 'applicantEmployeeId', 'date', 'startTime', 'estimatedMinutes', 'description'])
    expect(formFields).not.toContain('statusCode')
  })

  it('shows the joined applicant name and falls back to the identity', () => {
    const read = overtimeFields.applicantEmployeeId.read!
    expect(read({ applicantEmployeeId: 'e1', applicant: { fullName: 'Budi' } } as never)).toBe('Budi')
    expect(read({ applicantEmployeeId: 'e1' } as never)).toBe('e1')
  })

  it('exposes exact read-only lookup operation handlers', () => {
    expect(tollSections.capabilities.list.handler).toBe(tollSectionOperations.list)
    expect(tollSections.capabilities.detail.handler).toBe(tollSectionOperations.detail)
    expect(applicants.capabilities.list.handler).toBe(applicantOperations.list)
    expect(applicants.capabilities.detail.handler).toBe(applicantOperations.detail)
    expect(jobPositions.capabilities.list.handler).toBe(jobPositionOperations.list)
    expect(jobPositions.capabilities.detail.handler).toBe(jobPositionOperations.detail)
  })

  it('passes lookup capabilities directly with narrow metadata', () => {
    const section = overtimeFields.sectionId.form as any
    const applicant = overtimeFields.applicantEmployeeId.form as any
    const position = (overtimeListFilters.fields as any).jobPositionId.form

    expect(section.props).toMatchObject({
      fields: tollSections.fields,
      load: tollSections.capabilities.list.handler,
      loadDetail: tollSections.capabilities.detail.handler,
      pick: 'id',
      view: 'name',
    })
    expect(applicant.props).toMatchObject({
      fields: applicants.fields,
      load: applicants.capabilities.list.handler,
      loadDetail: applicants.capabilities.detail.handler,
      pick: 'id',
      view: 'fullName',
    })
    expect(position.props.load).toBe(jobPositions.capabilities.list.handler)
    expect(position.props.loadDetail).toBe(jobPositions.capabilities.detail.handler)

    expect(applicant.behavior.props({ draft: { sectionId: 'north' } })).toEqual({
      searchParameters: { sectionId: 'north' },
    })
  })

  it('loads lookup collections and details through exact typed RPC parents', async () => {
    await applicants.capabilities.list.handler({ query: { page: 1 }, searchParameters: { sectionId: 'north' } })
    await applicants.capabilities.detail.handler({ id: 'e1', searchParameters: {} })
    await tollSections.capabilities.list.handler({ query: {}, searchParameters: {} })
    await jobPositions.capabilities.detail.handler({ id: 'p1', searchParameters: {} })

    expect(applicantsListGet).toHaveBeenCalledWith(
      { query: { sectionId: 'north', page: '1' } },
      expect.objectContaining({ init: expect.any(Object) }),
    )
    expect(applicantsDetailGet).toHaveBeenCalledWith(
      { param: { id: 'e1' }, query: {} },
      expect.objectContaining({ init: expect.any(Object) }),
    )
    expect(tollSectionsListGet).toHaveBeenCalled()
    expect(jobPositionsDetailGet).toHaveBeenCalled()
  })
})

describe('overtime workflow calls', () => {
  // Asserted against the real RPC routes rather than a mocked generic `post`.
  // A mocked `post` is exactly what hid the dead mapping-user-roles/toggle
  // endpoint until plan 022 had to fix it.
  it('submits through the real submit route', async () => {
    await submitOvertime('o1')
    expect(submitPost).toHaveBeenCalledWith({ param: { id: 'o1' } })
  })

  it('verifies with the decision and an optional description', async () => {
    await verifyOvertime('o1', 'approved')
    expect(verifyPost).toHaveBeenCalledWith({ param: { id: 'o1' }, json: { decision: 'approved', description: undefined } })

    await verifyOvertime('o1', 'rejected', 'Tidak sesuai')
    expect(verifyPost).toHaveBeenLastCalledWith({ param: { id: 'o1' }, json: { decision: 'rejected', description: 'Tidak sesuai' } })
  })

  it('loads one record for the detail screen', async () => {
    expect(await loadOvertime('o1')).toEqual({ id: 'o1', statusCode: 'draft' })
    expect(detailGet).toHaveBeenCalledWith(
      { param: { id: 'o1' }, query: {} },
      { init: { signal: undefined } },
    )
  })
})

describe('verification timeline', () => {
  it('is an ordinary collection scoped by a search parameter', async () => {
    const result = await verificationSteps.table().table.load!({ query: {}, searchParameters: { overtime_id: 'o1' } })

    expect(stepsGet).toHaveBeenCalledWith({ param: { id: 'o1' } })
    expect((result as { data: unknown[] }).data).toHaveLength(1)
  })

  it('loads nothing when no record is in scope, rather than every chain', async () => {
    stepsGet.mockClear()
    const result = await verificationSteps.table().table.load!({ query: {}, searchParameters: {} })

    expect(stepsGet).not.toHaveBeenCalled()
    expect((result as { data: unknown[] }).data).toEqual([])
  })
})
