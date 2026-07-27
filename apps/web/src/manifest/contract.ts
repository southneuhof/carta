export type NavigationIcon = 'home' | 'inbox' | 'folder' | 'settings'
export type NavigationSeparator = { separator: string }
export type NavigationAction = { action: { permission: string | null; to?: unknown }; title: string; icon: NavigationIcon }
export type NavigationDirect = { to: { name: string }; permission: string | null; title: string; icon: NavigationIcon }
export type NavigationEntry = NavigationSeparator | NavigationAction | NavigationDirect
export type NavigationModule = {
  name: string
  title: string
  icon: NavigationIcon
  description?: string
  routes: readonly NavigationEntry[]
}
export function defineNavigation<const TNavigation extends readonly NavigationModule[]>(navigation: TNavigation): TNavigation { return navigation }
