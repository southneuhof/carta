import services from '@/utils/services'

export async function getData(getAPI: string, searchParameters?: Record<string, any>) {
  return (await services.list(getAPI, searchParameters)) as { data: Record<string, any>[]; totalPage: number; total: number }
}

export function onDataLoaded() {
  return
}

export const fieldTypes: Record<string, any> = {}
