import type { AppRouteName } from '@/router/route-names'

export type NavigationIcon = 'home' | 'inbox' | 'folder' | 'settings'
export type NavigationSeparator = { separator: string }
type NavigationSearch = { aliases?: readonly string[] }
export type NavigationAction = NavigationSearch & { action: { permission: string | null; to?: { name: AppRouteName; params?: Record<string, string> } }; title: string; icon: NavigationIcon }
export type NavigationDirect<TName extends AppRouteName = AppRouteName> = NavigationSearch & {
  to: { [Name in TName]: { name: Name } }[TName]
  permission: string | null
  title: string
  icon: NavigationIcon
}
export type NavigationEntry<TName extends AppRouteName = AppRouteName> = NavigationSeparator | NavigationAction | NavigationDirect<TName>
export type NavigationModule = {
  name: string
  title: string
  icon: NavigationIcon
  description?: string
} & ({ kind: 'module'; routes: readonly NavigationEntry[] } | { kind: 'standalone'; routes: readonly [NavigationDirect] })
export function defineNavigation<const TNavigation extends readonly NavigationModule[]>(navigation: TNavigation): TNavigation {
  return navigation
}
