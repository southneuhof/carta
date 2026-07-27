import { describe, expect, it, vi } from 'vitest'

const ok = (payload: unknown) => ({ ok: true, json: async () => payload })

const submitPost = vi.fn(async () => ok({ data: { id: 'o1', statusCode: 'waiting' } }))
const verifyPost = vi.fn(async () => ok({ data: { id: 'o1', statusCode: 'approved' } }))
const stepsGet = vi.fn(async () => ok({ data: [{ id: 's1', orderNumber: 1, statusCode: 'waiting' }], total: 1 }))
const detailGet = vi.fn(async () => ok({ data: { id: 'o1', statusCode: 'draft' } }))

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
    },
  },
}))

const { overtimes, verificationSteps, submitOvertime, verifyOvertime, loadOvertime, overtimeFields } = await import('./overtimes')

describe('overtimes resource', () => {
  it('declares mechanical route targets in actions', () => {
    expect(overtimes.actions.list).toMatchObject({ permission: 'overtimes.list', routeName: 'hr-overtimes' })
    const detailTarget = overtimes.actions.detail?.to
    expect(typeof detailTarget).toBe('function')
    expect((detailTarget as (id: string) => unknown)('o1')).toEqual({ name: 'hr-overtimes-detail', params: { overtimeId: 'o1' } })
    expect(overtimes.actions.delete).toMatchObject({ permission: 'overtimes.delete' })
    expect(overtimes.actions.delete?.to).toBeUndefined()
  })
  it('derives only the operations the API exposes', () => {
    // No delete: a submitted request is a record, so the control never appears.
    expect(overtimes.capabilities).toEqual({ list: true, detail: true, create: true, update: true, delete: false })
    expect(overtimes.detail({ id: 'o1' }).controls.map((control) => control.key)).not.toContain('delete')
  })

  it('keeps caller-derived fields off the form', () => {
    // applicant, section and status come from the session server-side.
    const formFields = Object.keys(overtimes.form().fields as Record<string, unknown>)
    expect(formFields).toEqual(['date', 'startTime', 'estimatedMinutes', 'description'])
    expect(formFields).not.toContain('applicantEmployeeId')
    expect(formFields).not.toContain('statusCode')
  })

  it('shows the joined applicant name and falls back to the identity', () => {
    const read = overtimeFields.applicantEmployeeId.read!
    expect(read({ applicantEmployeeId: 'e1', applicant: { fullName: 'Budi' } } as never)).toBe('Budi')
    expect(read({ applicantEmployeeId: 'e1' } as never)).toBe('e1')
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
    expect(detailGet).toHaveBeenCalledWith({ param: { id: 'o1' } })
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
