import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const appRoot = join(__dirname, '..', '..', '..')
const sectionEditorPath = join(appRoot, 'views/authenticated/website/website/_layouts/detail/_layouts/_layouts/SectionEditor.vue')
const sectionAddWizardPath = join(appRoot, 'views/authenticated/website/website/_layouts/detail/_layouts/_layouts/SectionAddWizard.vue')
const sectionGroupEditorPath = join(
  appRoot,
  'views/authenticated/website/website/_layouts/detail/_layouts/_layouts/_layouts/SectionGroup/SectionGroupEditor.vue',
)

const sectionFiles = [sectionEditorPath, sectionAddWizardPath, sectionGroupEditorPath]

describe('section editor wiring', () => {
  it('uses adapter imports in section editor', () => {
    const sectionEditor = readFileSync(sectionEditorPath, 'utf-8')
    expect(sectionEditor).toContain('getSectionPanelState')
    expect(sectionEditor).toContain('matchRootSchemaSlotsToStructure')
    expect(sectionEditor).toContain('matchNestedSchemaSlotsToStructure')
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

  it('uses nested add flow in section group editor when nested schema exists', () => {
    const sectionGroupEditor = readFileSync(sectionGroupEditorPath, 'utf-8')
    expect(sectionGroupEditor).toContain('buildCreateNestedSectionPayload')
    expect(sectionGroupEditor).toContain('isNestedSchemaGroup')
    expect(sectionGroupEditor).toContain('Boolean(editor.schema)')
    expect(sectionGroupEditor).toContain('v-else-if="isOpen && pageTranslation?.status_code === \'DRAFT\'"')
  })

  it('uses nested schema matching in section editor', () => {
    const sectionEditor = readFileSync(sectionEditorPath, 'utf-8')
    const legacyNestedParentData = 'nestedParentEditor.value?.' + 'data'
    const legacyMatchedEditorData = 'matched.editor.' + 'data ? matched : undefined'
    expect(sectionEditor).toContain('nestedParentEditor.value?.schema')
    expect(sectionEditor).toContain('matched.editor.schema ? matched : undefined')
    expect(sectionEditor).not.toContain(legacyNestedParentData)
    expect(sectionEditor).not.toContain(legacyMatchedEditorData)
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
