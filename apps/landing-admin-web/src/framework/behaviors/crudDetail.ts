import services from '@/utils/services'

export function onExport(detailConfig: any, id: number) {
  const base = detailConfig?.getAPI ? `${detailConfig.getAPI}` : ''
  if (!base) return
  return services.downloadFile(`${base}/export-buker/${id}`, `${base}_${new Date().toISOString()}.pdf`)
}
