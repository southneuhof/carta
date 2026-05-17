import services from '@/utils/services'

export async function getData(getAPI: string, searchParameters?: object) {
  const { data, total, totalPage } = await services.dataset(getAPI, { active: true, ...(searchParameters || {}) })
  return { data, total, totalPage }
}

export async function getDetail(getAPI: string, id: string | number, searchParameters?: object) {
  const { data } = await services.detail(getAPI, id, { active: true, ...(searchParameters || {}) })
  return data
}

export function dataFormatter(data: Array<Record<string, any>>, allowMulti: boolean, pick: string) {
  if (!allowMulti) return data[0]?.[pick]
  return data
}

export const fieldsAlias: Record<string, string> = {}
