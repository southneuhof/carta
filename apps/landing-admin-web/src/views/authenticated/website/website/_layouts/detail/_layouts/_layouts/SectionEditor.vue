<script setup lang="ts">
import services from '@/utils/services'
import ContentEditor from './_layouts/Content/ContentEditor.vue'
import Popover from '@southneuhof/is-vue-framework/components/base/Popover.vue'
import { toast } from 'vue-sonner'
import { keyManager } from '@/stores/keyManager'
import ConfirmationDialog from '@southneuhof/is-vue-framework/components/composites/ConfirmationDialog.vue'
import SectionSettings from './_layouts/Section/SectionSettings.vue'
import { computed, inject, provide, ref, unref, watch } from 'vue'
import GalleryEditor from './_layouts/Gallery/GalleryEditor.vue'
import SectionGroupEditor from './_layouts/SectionGroup/SectionGroupEditor.vue'
import { parse } from '@southneuhof/utilities/parse'
import {
  getNestedEditorConfig,
  getSectionPanelState,
  getSupportedEditorConfig,
  matchNestedSchemaSlotsToStructure,
  matchRootSchemaSlotsToStructure,
  type MatchedSchemaSlot,
  type SupportedSectionSlotEditorContext,
} from '@/features/sections/schemaAdapter'
import UnsupportedSectionPanel from '@/components/sections/UnsupportedSectionPanel.vue'
import Card from '@southneuhof/is-vue-framework/components/base/Card.vue'
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'
import Spinner from '@southneuhof/is-vue-framework/components/base/Spinner.vue'
import Dialog from '@southneuhof/is-vue-framework/components/base/Dialog.vue'

export type SectionData = {
  id: string
  name?: string | null
  description?: string | null
  section_type_code?: string | null
  visible?: boolean | null
  updated_at?: string | null
  section_group_id?: string | null
  parent_section_id?: string | null
  structure?: Array<{
    id?: string
    type: 'content' | 'gallery' | 'section' | 'sectionGroup'
    order: number
    gallery_id?: string | null
    [key: string]: unknown
  }>
  meta?: Record<string, any> | null
  [key: string]: unknown
}

const props = defineProps<{
  asChild?: boolean
  sectionID: string
  nestedParentMatch?: MatchedSchemaSlot | SupportedSectionSlotEditorContext
  parentSectionDataOverride?: SectionData | null
}>()

const pageTranslation = inject<any>('pageTranslation')
const sectionData = ref<SectionData>((await services.detail('section', props.sectionID)).data)

const injectedParentSectionData = inject<any>('sectionData', null)
const parentSectionData = computed(() => {
  if (props.parentSectionDataOverride !== undefined) return props.parentSectionDataOverride
  return unref(injectedParentSectionData) ?? null
})
const providedSectionData = computed(() => ({
  ...sectionData.value,
  parentSectionData: parentSectionData.value,
}))
const currentSectionData = computed(() => sectionData.value)
const nestedParentEditor = computed<SupportedSectionSlotEditorContext | null>(() => {
  if (!props.nestedParentMatch) return null
  return 'editor' in props.nestedParentMatch ? props.nestedParentMatch.editor : props.nestedParentMatch
})

provide('sectionData', providedSectionData)

const isNestedSchemaMode = computed(() => Boolean(nestedParentEditor.value?.schema))
const panelState = computed(() => {
  if (isNestedSchemaMode.value) return { kind: 'nested' as const }
  return getSectionPanelState(sectionData.value)
})
const editorConfig = computed(() =>
  panelState.value.kind === 'supported'
    ? getSupportedEditorConfig(panelState.value.code)
    : getNestedEditorConfig(nestedParentEditor.value?.schema),
)
const unsupportedViewModel = computed(() =>
  panelState.value.kind === 'unsupported' ? panelState.value.viewModel : null,
)

provide('sectionConfig', editorConfig)

const matchedSlots = computed<MatchedSchemaSlot[]>(() => {
  if (nestedParentEditor.value?.schema && props.nestedParentMatch) {
    return matchNestedSchemaSlotsToStructure({
      parentMatch: props.nestedParentMatch,
      structure: sectionData.value.structure ?? [],
    })
  }
  if (panelState.value.kind !== 'supported') return []
  return matchRootSchemaSlotsToStructure(panelState.value.code, sectionData.value.structure ?? [])
})

const isOpen = ref(Boolean(props.asChild))

watch(
  () => keyManager().value[`section-update-time-${sectionData.value.id}`],
  () => {
    sectionData.value.updated_at = new Date().toISOString()
    services.update('section', { ...sectionData.value, updated_at: new Date().toISOString() })
  },
)

function firstItem(match: { items: Array<{ id?: string | number }> }) {
  return match.items[0]
}

function slotEditor(match: MatchedSchemaSlot): SupportedSectionSlotEditorContext {
  return match.editor
}

function slotLabel(match: MatchedSchemaSlot) {
  return match.editor.label ?? match.slotKey
}
</script>

<template>
  <Suspense :timeout="0">
    <template #fallback>
      <div class="h-fit w-full flex items-center justify-center"><Spinner /></div>
    </template>
    <Card class="bg-transparent" :variant="!asChild ? 'outlined' : 'filled'" :class="{ 'p-0': asChild }">
      <div class="flex flex-row items-center justify-between gap-4">
        <div class="flex flex-row items-center gap-2" :class="{ 'text-muted': !sectionData.visible }">
          <Icon name="folder"></Icon>
          <div>
            <p class="text-xl font-semibold">{{ sectionData.name }} <span class="text-xs font-normal text-muted">{{ sectionData.section_type_code }}</span></p>
            <p class="text-sm"><span class="text-muted">Diperbarui</span> <span class="text-on-surface/[67%]">{{ parse('datetime', sectionData.updated_at) }}</span></p>
          </div>
          <Popover>
            <template #trigger>
              <Button variant="standard" kind="icon" aria-label="Opsi section">
                <template #icon>
                  <Icon name="more"></Icon>
                </template>
              </Button>
            </template>
            <template #content>
              <Card class="gap-1 rounded-md p-1 outline outline-1 outline-outline/[38%]">
                <ConfirmationDialog
                  v-if="!sectionData.parent_section_id && pageTranslation?.status_code === 'DRAFT'"
                  :onConfirm="() => {
                    services.delete('section', { id: sectionData.id }).then(() => {
                      toast.success('Berhasil menghapus section!')
                      keyManager().triggerChange(`sectionGroup-${sectionData.section_group_id}`)
                    })
                  }"
                >
                  <template #trigger>
                    <Card class="flex-row items-center gap-4 rounded-md p-2" color="errorContainer">
                      <Icon name="delete-bin"></Icon>
                      <p>Hapus</p>
                    </Card>
                  </template>
                </ConfirmationDialog>
                <Dialog>
                  <template #trigger>
                    <Card class="flex-row items-center gap-4 rounded-md p-2">
                      <Icon name="settings"></Icon>
                      <p>Pengaturan Section</p>
                    </Card>
                  </template>
                  <template #content>
                    <SectionSettings />
                  </template>
                </Dialog>
              </Card>
            </template>
          </Popover>
        </div>
        <Button
          v-if="!asChild"
          variant="standard"
          kind="icon"
          aria-label="Toggle section"
          @click="() => (isOpen = !isOpen)"
        >
          <template #icon>
            <Icon :name="isOpen ? 'arrow-up-s' : 'arrow-down-s'"></Icon>
          </template>
        </Button>
      </div>

      <template v-if="isOpen">
        <UnsupportedSectionPanel
          v-if="unsupportedViewModel"
          :sectionName="unsupportedViewModel.sectionName"
          :sectionTypeCode="unsupportedViewModel.sectionTypeCode"
          :visible="unsupportedViewModel.visible"
          :updatedAt="unsupportedViewModel.updatedAt"
          :message="unsupportedViewModel.message"
        />

        <div v-else class="flex flex-col gap-2">
          <div v-for="matched in matchedSlots" :key="matched.pathKey" class="flex flex-col gap-4">
            <component
              v-if="matched.editor.component"
              :is="matched.editor.component"
              :slotConfig="slotEditor(matched)"
              :sectionData="providedSectionData"
              :objectID="firstItem(matched)?.id ? String(firstItem(matched).id) : undefined"
            />

            <template v-else-if="matched.slot.type === 'content'">
              <ContentEditor
                v-if="firstItem(matched)?.id"
                :contentID="String(firstItem(matched)?.id)"
                :key="keyManager().value[`content-${firstItem(matched)?.id}`]"
                :slotConfig="slotEditor(matched)"
                :sectionData="providedSectionData"
                :name="slotLabel(matched)"
              />
              <Card v-else class="text-sm text-muted">No data found for this slot.</Card>
            </template>

            <template v-else-if="matched.slot.type === 'gallery'">
              <template v-if="matched.items.length">
                <GalleryEditor
                  v-for="item in matched.items"
                  :galleryID="String(item.id)"
                  :key="keyManager().value[`gallery-${item.id}`]"
                  :slotConfig="slotEditor(matched)"
                  :sectionData="providedSectionData"
                  :name="slotLabel(matched)"
                />
              </template>
              <Card v-else class="text-sm text-muted">No data found for this slot.</Card>
            </template>

            <template v-else-if="matched.slot.type === 'sectionGroup'">
              <template v-if="matched.items.length">
                <SectionGroupEditor
                  v-for="item in matched.items"
                  :sectionGroupID="String(item.id)"
                  :nestedParentMatch="matched.editor.schema ? matched : undefined"
                  :parentSectionData="currentSectionData"
                  :key="keyManager().value[`sectionGroupOrchestrator-${item.id}`]"
                />
              </template>
              <Card v-else class="text-sm text-muted">No data found for this slot.</Card>
            </template>

            <template v-else-if="matched.slot.type === 'section'">
              <template v-if="matched.items.length">
                <SectionEditor
                  v-for="item in matched.items"
                  asChild
                  :sectionID="String(item.id)"
                  :nestedParentMatch="matched.editor.schema ? matched : undefined"
                  :parentSectionDataOverride="currentSectionData"
                  :key="keyManager().value[`section-${item.id}`]"
                />
              </template>
              <Card v-else class="text-sm text-muted">No data found for this slot.</Card>
            </template>
          </div>
        </div>
      </template>
    </Card>
  </Suspense>
</template>
