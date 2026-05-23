import services from '@/utils/services'
import { parse } from '@southneuhof/utilities/parse'
import * as XLSX from 'xlsx'

export async function onDelete(endpoint: string, id: string | number) {
  await services.delete(endpoint, { id })
}

export async function onExport({ exportAPI, params, listConfig }: { exportAPI: string; params: Record<string, any>; listConfig: any }) {
  const response = await services.raw(exportAPI, { ...params, limit: 99999 })
  const contentType = response.headers?.get?.('Content-Type') || ''
  const maybeBlob = contentType.includes('application/vnd.openxmlformats') || contentType.includes('application/octet-stream') || contentType.includes('application/vnd.ms-excel')

  if (maybeBlob && response.blob) {
    const blob = await response.blob()
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.download = `${exportAPI.split('/').pop() || 'export'}.xlsx`
    link.click()
    URL.revokeObjectURL(link.href)
    return
  }

  const payload = await response.json?.()
  const rows = payload?.data || []
  const sheetData = rows.map((row: any) =>
    Object.fromEntries((listConfig.fields || []).map((field: string) => [listConfig.fieldsAlias?.[field] || field, listConfig.fieldsParse?.[field] ? parse(listConfig.fieldsParse[field], row[field]) : row[field]]))
  )
  const ws = XLSX.utils.json_to_sheet(sheetData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Data')
  XLSX.writeFile(wb, `${exportAPI.split('/').pop() || 'export'}.xlsx`)
}

export function onDragChange(reorderAPI: string, event: any) {
  if (!event.moved) return
  return services.put(`${reorderAPI}/reorder`, {
    ...event.moved.element,
    from: event.moved.oldIndex + 1,
    to: event.moved.newIndex + 1,
  })
}
