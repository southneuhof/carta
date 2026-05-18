export function resolveDraftTargetSectionGroupId(input: {
  sectionGroupId: string
  idMap: Map<string, string> | null
}) {
  if (!input.idMap) return input.sectionGroupId

  const mappedId = input.idMap.get(input.sectionGroupId)
  if (!mappedId) throw new Error('Target section group was not copied into the draft')

  return mappedId
}
