import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const appRoot = join(__dirname, '..', '..')
const srcRoot = join(appRoot)

function walk(dir: string, acc: string[] = []): string[] {
  const entries = readdirSync(dir)
  for (const entry of entries) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, acc)
    else if (full.endsWith('.vue') || full.endsWith('.ts')) acc.push(full)
  }
  return acc
}

describe('app specific config wiring', () => {
  it('has no old app config imports in source files', () => {
    const files = walk(srcRoot).filter((file) => !file.includes('__tests__'))
    for (const file of files) {
      const content = readFileSync(file, 'utf-8')
      expect(content).not.toContain("@/app/configs")
      expect(content).not.toContain('utils/projectcommons/menuItemFormConfig')
    }
  })

  it('master and ad banner views use model imports', () => {
    const languageView = readFileSync(join(srcRoot, 'views/authenticated/master/language/language.vue'), 'utf-8')
    const layoutTypeView = readFileSync(join(srcRoot, 'views/authenticated/master/layoutType/layoutType.vue'), 'utf-8')
    const adBannerView = readFileSync(join(srcRoot, 'views/authenticated/website/adBannerLanguageMap/adBannerLanguageMap.vue'), 'utf-8')

    expect(languageView).toContain('languageModel')
    expect(layoutTypeView).toContain('layoutTypeModel')
    expect(adBannerView).toContain('adBannerLanguageMapModel')
  })

  it('menu views use feature menu config', () => {
    const menuItemView = readFileSync(join(srcRoot, 'views/authenticated/website/website/_layouts/list/_layouts/MenuItemView.vue'), 'utf-8')
    const menuGeneralSettings = readFileSync(join(srcRoot, 'views/authenticated/website/website/_layouts/list/_layouts/_layouts/_layouts/MenuGeneralSettings.vue'), 'utf-8')

    expect(menuItemView).toContain("@/features/menu/menuItemFormConfig")
    expect(menuGeneralSettings).toContain("@/features/menu/menuItemFormConfig")
  })
})
