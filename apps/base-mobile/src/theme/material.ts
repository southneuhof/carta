import { MATERIAL_THEME_TOKENS, type MaterialScheme, type MaterialThemeTokens } from '@southneuhof/domain'

type MaterialColorToken = `${number} ${number} ${number}`

function toRgb(value: MaterialColorToken) {
  return `rgb(${value})`
}

export type MobileMaterialPalette = {
  primary: string
  surfaceTint: string
  onPrimary: string
  primaryContainer: string
  onPrimaryContainer: string
  secondary: string
  onSecondary: string
  secondaryContainer: string
  onSecondaryContainer: string
  tertiary: string
  onTertiary: string
  tertiaryContainer: string
  onTertiaryContainer: string
  error: string
  onError: string
  errorContainer: string
  onErrorContainer: string
  background: string
  onBackground: string
  surface: string
  onSurface: string
  surfaceVariant: string
  onSurfaceVariant: string
  outline: string
  outlineVariant: string
  shadow: string
  scrim: string
  inverseSurface: string
  inverseOnSurface: string
  inversePrimary: string
  surfaceContainerLowest: string
  surfaceContainerLow: string
  surfaceContainer: string
  surfaceContainerHigh: string
  surfaceContainerHighest: string
}

function buildPalette(tokens: MaterialThemeTokens): MobileMaterialPalette {
  return {
    primary: toRgb(tokens.primary),
    surfaceTint: toRgb(tokens.surfaceTint),
    onPrimary: toRgb(tokens.onPrimary),
    primaryContainer: toRgb(tokens.primaryContainer),
    onPrimaryContainer: toRgb(tokens.onPrimaryContainer),
    secondary: toRgb(tokens.secondary),
    onSecondary: toRgb(tokens.onSecondary),
    secondaryContainer: toRgb(tokens.secondaryContainer),
    onSecondaryContainer: toRgb(tokens.onSecondaryContainer),
    tertiary: toRgb(tokens.tertiary),
    onTertiary: toRgb(tokens.onTertiary),
    tertiaryContainer: toRgb(tokens.tertiaryContainer),
    onTertiaryContainer: toRgb(tokens.onTertiaryContainer),
    error: toRgb(tokens.error),
    onError: toRgb(tokens.onError),
    errorContainer: toRgb(tokens.errorContainer),
    onErrorContainer: toRgb(tokens.onErrorContainer),
    background: toRgb(tokens.background),
    onBackground: toRgb(tokens.onBackground),
    surface: toRgb(tokens.surface),
    onSurface: toRgb(tokens.onSurface),
    surfaceVariant: toRgb(tokens.surfaceVariant),
    onSurfaceVariant: toRgb(tokens.onSurfaceVariant),
    outline: toRgb(tokens.outline),
    outlineVariant: toRgb(tokens.outlineVariant),
    shadow: toRgb(tokens.shadow),
    scrim: toRgb(tokens.scrim),
    inverseSurface: toRgb(tokens.inverseSurface),
    inverseOnSurface: toRgb(tokens.inverseOnSurface),
    inversePrimary: toRgb(tokens.inversePrimary),
    surfaceContainerLowest: toRgb(tokens.surfaceContainerLowest),
    surfaceContainerLow: toRgb(tokens.surfaceContainerLow),
    surfaceContainer: toRgb(tokens.surfaceContainer),
    surfaceContainerHigh: toRgb(tokens.surfaceContainerHigh),
    surfaceContainerHighest: toRgb(tokens.surfaceContainerHighest),
  }
}

export const MOBILE_MATERIAL_COLORS: Record<MaterialScheme, MobileMaterialPalette> = {
  light: buildPalette(MATERIAL_THEME_TOKENS.light),
  dark: buildPalette(MATERIAL_THEME_TOKENS.dark),
}

export const materialColors = MOBILE_MATERIAL_COLORS.light
