import services from '@/utils/services'

export async function getTemplate(templateAPI: string) {
  const { data } = await services.get(templateAPI)
  return data
}
