import services from '@/utils/services'

export async function getData(getAPI: string, searchParameters?: object) {
  const { data } = await services.dataset(getAPI, { active: true, ...(searchParameters || {}) })
  return data
}
