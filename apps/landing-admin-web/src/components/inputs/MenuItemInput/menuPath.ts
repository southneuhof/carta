export type MenuPathItem = {
  id: string
  slug: string
  name: string
  menu_item_type?: string
}

export type MenuPathSelection = {
  selectedItems: Array<MenuPathItem | undefined>
  currentSelectedIds: Array<string | undefined>
}

export type MenuPathListItem = {
  id: string
  slug?: string | null
  name?: string | null
  menu_item_type?: string | null
  translations?: Array<{ language?: string | null; name?: string | null }>
}

export function createEmptyMenuPathSelection(depth = 3): MenuPathSelection {
  return {
    selectedItems: Array.from({ length: depth }, () => undefined),
    currentSelectedIds: Array.from({ length: depth }, () => undefined),
  }
}

export function getMenuItemName(item: MenuPathListItem | null | undefined) {
  if (!item) return ''
  return item.translations?.find((translation) => translation.language === 'id')?.name || item.name || ''
}

export function isInternalWebsitePath(path: string | undefined | null) {
  return typeof path === 'string' && path.startsWith('/')
}

export function buildMenuPathFromSelectedItems(items: Array<MenuPathItem | undefined>) {
  const path = items
    .filter((item) => item?.slug)
    .map((item) => item!.slug)
    .join('/')

  return path ? `/${path}` : undefined
}

export async function initializeMenuPathSelection(
  path: string | undefined,
  fetchMenuItemsAtLevel: (params: { level: number; parent_id?: string }) => Promise<MenuPathListItem[] | undefined>,
  depth = 3,
): Promise<MenuPathSelection> {
  const nextSelection = createEmptyMenuPathSelection(depth)

  if (!isInternalWebsitePath(path)) return nextSelection

  const slugs = path.substring(1).split('/').filter(Boolean)
  let currentParentId: string | undefined

  for (let index = 0; index < Math.min(slugs.length, depth); index += 1) {
    const level = index + 1
    const itemsAtLevel = await fetchMenuItemsAtLevel({
      level,
      ...(currentParentId ? { parent_id: currentParentId } : {}),
    })

    const matchedItem = itemsAtLevel?.find((item) => item.slug === slugs[index])
    if (!matchedItem?.id || !matchedItem.slug) break

    nextSelection.selectedItems[index] = {
      id: matchedItem.id,
      slug: matchedItem.slug,
      name: getMenuItemName(matchedItem),
      menu_item_type: matchedItem.menu_item_type ?? undefined,
    }
    nextSelection.currentSelectedIds[index] = matchedItem.id
    currentParentId = matchedItem.id
  }

  return nextSelection
}
