export const titleCase = (s: string) =>
  s
    .replace(/^[-_]*(.)/, (_: any, c: any) => c.toUpperCase())
    .replace(/[-_]+(.)/g, (_: any, c: any) => ` ${c.toUpperCase()}`)

export function parseCode(text: string) {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
}

export const languages = [
  { name: 'ID', code: 'id' },
  { name: 'EN', code: 'en' },
]

export function parseSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function getSmallestChildObject(object: Record<string, any>, key: string) {
  const childObject = object[key]
  if (childObject) return getSmallestChildObject(childObject, key)
  return object
}
