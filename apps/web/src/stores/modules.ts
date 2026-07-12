import { defineStore } from 'pinia'
import navigationManifest from '@/components/navigations/navigation-manifest'
import { permissions } from './permissions'

const value: Array<Module> = []

function compactSeparators(routes: any[]): any[] {
  const normalized = [...routes]

  for (let i = 0; i < normalized.length - 1; i++) {
    if (normalized[i].separator && normalized[i + 1].separator) {
      normalized.splice(i, 1)
      i--
    }
  }

  if (normalized.length > 0 && normalized[normalized.length - 1].separator) {
    normalized.splice(normalized.length - 1, 1)
  }

  return normalized
}

export const modules = defineStore('modules', () => {
  function build() {
    clear()
    navigationManifest.forEach((item) => {
      if (item.routes.length === 1) {
        if (permissions().has(`view-${item.permission || item.name}`)) {
          value.push(item)
        }
        return
      }

      const routes = (item.routes as any).filter((route: any) => {
        if (route.separator) return true
        if (route.name) {
          return permissions().has(`view-${route.permission || route.name}`)
        }
        return false
      })

      const cleanedRoutes = compactSeparators(routes)
      if (cleanedRoutes.length !== 0) {
        value.push({ ...item, routes: cleanedRoutes })
      }
    })

    return true
  }

  function clear() {
    value.splice(0, value.length)
  }

  function rebuild() {
    clear()
    build()
  }

  if (!value?.length) build()
  return { value, build, clear, rebuild }
})

export function transformData(data: any[]) {
  return data
    .map((item) => {
      const newRoutes: any[] = []
      let currentSection: any = null

      item.routes.forEach((route: any) => {
        if (permissions().has(`view-${route.permission || route.name}`) || route.separator) {
          if (route.separator) {
            if (currentSection && currentSection.routes.length > 0) {
              newRoutes.push(currentSection)
            }
            currentSection = {
              section: route.name,
              routes: [],
            }
          } else if (currentSection) {
            currentSection.routes.push(route)
          }
        }
      })

      if (currentSection && currentSection.routes.length > 0) {
        newRoutes.push(currentSection)
      }

      return newRoutes.length > 0
        ? {
            ...item,
            routes: newRoutes,
          }
        : null
    })
    .filter((item) => item !== null)
}
