import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { MaterialScheme } from '@southneuhof/domain'
import { MOBILE_MATERIAL_COLORS, type MobileMaterialPalette } from './material'

type MaterialThemeContextValue = {
  scheme: MaterialScheme
  colors: MobileMaterialPalette
  setScheme: (scheme: MaterialScheme) => void
}

const MaterialThemeContext = createContext<MaterialThemeContextValue | null>(null)

type MaterialThemeProviderProps = {
  children: ReactNode
}

export function MaterialThemeProvider({ children }: MaterialThemeProviderProps) {
  const [scheme, setScheme] = useState<MaterialScheme>('light')

  const value = useMemo<MaterialThemeContextValue>(
    () => ({
      scheme,
      colors: MOBILE_MATERIAL_COLORS[scheme],
      setScheme,
    }),
    [scheme]
  )

  return <MaterialThemeContext.Provider value={value}>{children}</MaterialThemeContext.Provider>
}

export function useMaterialTheme() {
  const context = useContext(MaterialThemeContext)
  if (!context) {
    throw new Error('useMaterialTheme must be used within MaterialThemeProvider.')
  }
  return context
}

export function useMaterialColors() {
  return useMaterialTheme().colors
}
