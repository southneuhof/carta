<script setup lang="ts">
import services from '@/utils/services'
import ContentEditor from './_layouts/Content/ContentEditor.vue'
import Popover from '@southneuhof/is-vue-framework/components/base/Popover.vue'
import { toast } from 'vue-sonner'
import { keyManager } from '@/stores/keyManager'
import ConfirmationDialog from '@southneuhof/is-vue-framework/components/composites/ConfirmationDialog.vue'
import SectionSettings from './_layouts/Section/SectionSettings.vue'
import { computed, inject, provide, ref, watch } from 'vue'
import GalleryEditor from './_layouts/Gallery/GalleryEditor.vue'
import SectionGroupEditor from './_layouts/SectionGroup/SectionGroupEditor.vue'
import { parse } from '@/utils/common'
import {
  getSectionPanelState,
  getSupportedEditorConfig,
  matchSchemaSlotsToStructure,
  type SupportedSectionSlotEditor,
} from '@/features/sections/schemaAdapter'
import UnsupportedSectionPanel from '@/components/sections/UnsupportedSectionPanel.vue'
import { resolveSectionSlotEditor } from '@/features/sections/editorRegistry'

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
}>()

const pageTranslation = inject<any>('pageTranslation')
const sectionData = ref<SectionData>((await services.detail('section', props.sectionID)).data)
const parentSectionData = inject<any>('sectionData')

provide('sectionData', computed(() => ({ ...sectionData.value, parentSectionData })))

const panelState = computed(() => getSectionPanelState(sectionData.value))
const editorConfig = computed(() =>
  panelState.value.kind === 'supported' ? getSupportedEditorConfig(panelState.value.code) : null,
)

provide('sectionConfig', editorConfig)

const matchedSlots = computed(() =>
  editorConfig.value ? matchSchemaSlotsToStructure(editorConfig.value.code, sectionData.value.structure ?? []) : [],
)

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

function slotEditor(slotKey: string): SupportedSectionSlotEditor | undefined {
  return editorConfig.value?.slots.find((slot) => slot.key === slotKey)
}

function slotLabel(slotKey: string) {
  return slotEditor(slotKey)?.label ?? slotKey
}
</script>

<template>
  <Suspense :timeout="0">
    <template #fallback>
      <div class="h-fit w-full flex items-center justify-center"><Spinner /></div>
    </template>
    <Card class="bg-transparent" :class="{ 'outline outline-1 outline-outline': !asChild, 'p-0': asChild }">
      <div class="flex flex-row items-center justify-between gap-4">
        <div class="flex flex-row items-center gap-2" :class="{ 'text-muted': !sectionData.visible }">
          <Icon>folder</Icon>
          <div>
            <p class="text-xl font-semibold">{{ sectionData.name }} <span class="text-xs font-normal text-muted">{{ sectionData.section_type_code }}</span></p>
            <p class="text-sm"><span class="text-muted">Diperbarui</span> <span class="text-on-surface/[67%]">{{ parse('datetime', sectionData.updated_at) }}</span></p>
          </div>
          <Popover>
            <template #trigger>
              <Button variant="standard"><Icon>more_horiz</Icon></Button>
            </template>
            <template #content>
              <Card class="gap-1 rounded-md p-1 outline outline-1 outline-outline/[38%]">
                <ConfirmationDialog
                  v-if="!sectionData.parent_section_id && pageTranslation?.status_code === 'DRAFT' && panelState.kind === 'supported'"
                  :onConfirm="() => {
                    services.delete('section', { id: sectionData.id }).then(() => {
                      toast.success('Berhasil menghapus section!')
                      keyManager().triggerChange(`sectionGroup-${sectionData.section_group_id}`)
                    })
                  }"
                >
                  <template #trigger>
                    <Card class="flex-row items-center gap-4 rounded-md p-2" color="errorContainer">
                      <Icon>delete_forever</Icon>
                      <p>Hapus</p>
                    </Card>
                  </template>
                </ConfirmationDialog>
                <Modal>
                  <template #trigger>
                    <Card class="flex-row items-center gap-4 rounded-md p-2">
                      <Icon>settings</Icon>
                      <p>Pengaturan Section</p>
                    </Card>
                  </template>
                  <template #content>
                    <SectionSettings />
                  </template>
                </Modal>
              </Card>
            </template>
          </Popover>
        </div>
        <Button v-if="!asChild" variant="standard" @click="() => (isOpen = !isOpen)"><Icon>{{ isOpen ? 'expand_less' : 'expand_more' }}</Icon></Button>
      </div>

      <template v-if="isOpen">
        <UnsupportedSectionPanel
          v-if="panelState.kind === 'unsupported'"
          :sectionName="panelState.viewModel.sectionName"
          :sectionTypeCode="panelState.viewModel.sectionTypeCode"
          :visible="panelState.viewModel.visible"
          :updatedAt="panelState.viewModel.updatedAt"
          :message="panelState.viewModel.message"
        />

        <div v-else class="flex flex-col gap-4">
          <div v-for="matched in matchedSlots" :key="matched.slotKey" class="flex flex-col gap-4">
            <component
              v-if="resolveSectionSlotEditor(matched.editor.customEditorKey) && matched.items.length"
              :is="resolveSectionSlotEditor(matched.editor.customEditorKey)"
              :slotConfig="slotEditor(matched.slotKey)"
              :sectionData="{ ...sectionData, parentSectionData }"
              :objectID="String(matched.items[0].id)"
            />

            <template v-else-if="matched.slot.type === 'content'">
              <ContentEditor
                v-if="firstItem(matched)?.id"
                :contentID="String(firstItem(matched)?.id)"
                :key="keyManager().value[`content-${firstItem(matched)?.id}`]"
                :slotConfig="slotEditor(matched.slotKey)"
                :sectionData="{ ...sectionData, parentSectionData }"
                :name="slotLabel(matched.slotKey)"
              />
              <Card v-else class="text-sm text-muted">No data found for this slot.</Card>
            </template>

            <template v-else-if="matched.slot.type === 'gallery'">
              <template v-if="matched.items.length">
                <GalleryEditor
                  v-for="item in matched.items"
                  :galleryID="String(item.id)"
                  :key="keyManager().value[`gallery-${item.id}`]"
                  :slotConfig="slotEditor(matched.slotKey)"
                  :sectionData="{ ...sectionData, parentSectionData }"
                  :name="slotLabel(matched.slotKey)"
                />
              </template>
              <Card v-else class="text-sm text-muted">No data found for this slot.</Card>
            </template>

            <template v-else-if="matched.slot.type === 'sectionGroup'">
              <template v-if="matched.items.length">
                <SectionGroupEditor
                  v-for="item in matched.items"
                  :sectionGroupID="String(item.id)"
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
