import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const appRoot = join(__dirname, '..', '..', '..')
const sectionEditorPath = join(appRoot, 'views/authenticated/website/website/_layouts/detail/_layouts/_layouts/SectionEditor.vue')
const sectionAddWizardPath = join(appRoot, 'views/authenticated/website/website/_layouts/detail/_layouts/_layouts/SectionAddWizard.vue')

const sectionFiles = [sectionEditorPath, sectionAddWizardPath]

describe('section editor wiring', () => {
  it('uses adapter imports in section editor', () => {
    const sectionEditor = readFileSync(sectionEditorPath, 'utf-8')
    expect(sectionEditor).toContain('getSectionPanelState')
    expect(sectionEditor).toContain('matchSchemaSlotsToStructure')
    expect(sectionEditor).toContain('matched.editor.component')
    expect(sectionEditor).not.toContain('resolveSectionSlotEditor')
    expect(sectionEditor).not.toContain('customEditorKey')
    expect(sectionEditor).not.toContain('editorRegistry')
  })

  it('uses section overlay configs from adapter', () => {
    const adapterPath = join(appRoot, 'features/sections/schemaAdapter.ts')
    const adapter = readFileSync(adapterPath, 'utf-8')
    expect(adapter).toContain('@/configs/sections')
  })

  it('uses add section options in add wizard', () => {
    const sectionAddWizard = readFileSync(sectionAddWizardPath, 'utf-8')
    expect(sectionAddWizard).toContain('getAddSectionOptions')
  })

  it('does not use legacy sectionType configs', () => {
    const legacyImport = '@/app/configs/' + 'sectionTypes'
    const legacyVar = 'sectionType' + 'Configs'
    for (const file of sectionFiles) {
      const content = readFileSync(file, 'utf-8')
      expect(content).not.toContain(legacyImport)
      expect(content).not.toContain(legacyVar)
    }
  })
})
