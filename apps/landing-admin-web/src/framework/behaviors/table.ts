import services from '@/utils/services'

export async function getData(getAPI: string, searchParameters?: Record<string, any>) {
  const {data, meta: {totalPages, totalRecords}} = await services.list(getAPI, searchParameters)
  return { data, totalPage: totalPages, total: totalRecords }
}

export function onDataLoaded() {
  return
}

export const fieldTypes: Record<string, any> = {}
