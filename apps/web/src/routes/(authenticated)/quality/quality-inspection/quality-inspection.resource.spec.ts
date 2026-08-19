import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { appFieldDefaults } from '@/configs/defaults'
import { createFrameworkQueryClient, registerResourceRuntime, resetResourceRuntimeForTests, resolveFields, resolveFrameworkAdapters, resolveFrameworkFieldDefaults } from '@southneuhof/is-vue-framework'
import { divisions } from '@/routes/(authenticated)/master-data/divisions/divisions.resource'
import { projects } from '@/routes/(authenticated)/master-data/projects/projects.resource'
import { ptsWorkCategories } from '@/routes/(authenticated)/master-data/pts-work-categories/pts-work-categories.resource'
import { workItems } from '@/routes/(authenticated)/master-data/work-items/work-items.resource'
import { qualityInspection } from './quality-inspection.resource'
import { statusOptions } from './quality-inspection.schema'

beforeEach(() => registerResourceRuntime({ adapters: resolveFrameworkAdapters(), queryClient: createFrameworkQueryClient(), fieldDefaults: resolveFrameworkFieldDefaults(appFieldDefaults) }))
afterEach(() => resetResourceRuntimeForTests())

function fields(value: unknown, surface: 'form' | 'table' | 'detail') {
  return resolveFields({ fields: value as never, surface, defaultFields: resolveFrameworkFieldDefaults(appFieldDefaults).fields })
}

describe('Inspection/Test resource', () => {
  it('keeps legacy labels, field order, owner sources, and standard routes', () => {
    const form = fields(qualityInspection.create().fields, 'form')
    expect(form.map((field) => field.key)).toEqual(['divisionId', 'projectId', 'targetDate', 'qualityWorkCategoryId', 'workItemCategoryId', 'locationZone', 'selectedRows'])
    expect(form.map((field) => field.label)).toEqual(['Divisi', 'Proyek', 'Target Pelaksanaan', 'Kategori Pekerjaan', 'Jenis Pekerjaan', 'Area/Zona Kerja', 'Item Pekerjaan'])
    expect(form.find((field) => field.key === 'divisionId')?.source).toBe(divisions)
    expect(form.find((field) => field.key === 'projectId')?.source).toBe(projects)
    expect(form.find((field) => field.key === 'qualityWorkCategoryId')?.source).toBe(ptsWorkCategories)
    const root = form.find((field) => field.key === 'workItemCategoryId')!
    expect(root.source).toBe(workItems)
    expect(root.behavior?.disabled?.({ draft: {} } as never)).toBe(true)
    expect(root.behavior?.disabled?.({ draft: { projectId: 'project-1' } } as never)).toBe(true)
    expect(root.behavior?.disabled?.({ draft: { projectId: 'project-1', qualityWorkCategoryId: 'category-1' } } as never)).toBe(false)
    expect(root.behavior?.props?.({ draft: { projectId: 'project-1', qualityWorkCategoryId: 'category-1' } } as never)).toEqual({ searchParameters: { projectId: 'project-1', categoryId: 'category-1', rootOnly: true, active: true } })
    expect((qualityInspection.list().detailRoute?.({ id: 'qi-1' } as never))).toEqual({ name: 'quality-quality-inspection-detail', params: { qualityInspectionId: 'qi-1' } })
    expect(qualityInspection.list().updateRoute?.({ id: 'qi-1' } as never)).toEqual({ name: 'quality-quality-inspection-edit', params: { qualityInspectionId: 'qi-1' } })
  })

  it('uses legacy status labels and validates selected rows', () => {
    const table = fields(qualityInspection.list().fields, 'table')
    expect(table.map((field) => field.key)).toEqual(['number', 'projectId', 'targetDate', 'workItemCategoryId', 'createdByName', 'createdAt', 'locationZone', 'statusCode', 'stepCode'])
    expect(table.map((field) => field.label)).toEqual(['Nomor Inspection/Test', 'Proyek', 'Target Pelaksanaan', 'Jenis Pekerjaan', 'Dilaporkan Oleh', 'Tanggal Laporan', 'Area/Zona Kerja', 'Status', 'Tahap'])
    expect(statusOptions).toEqual([
      { id: 'open', name: 'Open' },
      { id: 'on-progress', name: 'On Progress' },
      { id: 'close', name: 'Closed' },
    ])
    expect(qualityInspection.list().schema?.validate({ startMonth: '2026-08', endMonth: '2026-08' }).success).toBe(true)
    expect(qualityInspection.list().schema?.validate({ startMonth: '2026-8' }).success).toBe(false)
    expect(qualityInspection.create().schema?.validate({ divisionId: 'd1', projectId: 'p1', targetDate: '2026-08-20', qualityWorkCategoryId: 'c1', workItemCategoryId: 'w1', selectedRows: [] }).success).toBe(false)
    expect(qualityInspection.create().schema?.validate({ divisionId: 'd1', projectId: 'p1', targetDate: '2026-08-20', qualityWorkCategoryId: 'c1', workItemCategoryId: 'w1', selectedRows: [{ workItemId: 'leaf', volume: 1, itpTypeCodes: ['material'] }] }).success).toBe(true)
  })

  it('selects the complete report detail field set in order', () => {
    const detail = fields(qualityInspection.detail({ id: 'qi-1' }).fields, 'detail')
    expect(detail.map((field) => field.key)).toEqual([
      'number', 'divisionId', 'projectId', 'targetDate', 'qualityWorkCategoryId', 'workItemCategoryId',
      'locationZone', 'createdByName', 'scheduleId', 'scheduleStartDate', 'scheduleEndDate',
      'statusCode', 'stepCode', 'resultCode', 'verificationDescription', 'inspectionPointCode', 'workMethod', 'createdAt',
    ])
    expect(detail.map((field) => field.label)).toEqual([
      'Nomor Inspection/Test', 'Divisi', 'Proyek', 'Target Pelaksanaan', 'Kategori Pekerjaan', 'Jenis Pekerjaan',
      'Area/Zona Kerja', 'Dilaporkan Oleh', 'Jadwal', 'Periode Mulai', 'Periode Selesai', 'Status', 'Tahap',
      'Hasil Inspeksi', 'Catatan', 'Inspection Point', 'Prosedur / Metode Kerja', 'Tanggal Laporan',
    ])
    expect(detail.find((field) => field.key === 'statusCode')?.renderer).toBe('chip')
    expect(detail.find((field) => field.key === 'resultCode')?.renderer).toBe('chip')
  })
})
