<script setup lang="ts">
import Form from '@southneuhof/is-vue-framework/components/composites/Form.vue'
import Table from '@southneuhof/is-vue-framework/components/composites/Table.vue'
import { keyManager } from '@/stores/keyManager'
import { toast } from 'vue-sonner'
import services from '@/utils/services'
import { computed, inject, ref, type PropType } from 'vue'
import ConfirmationDialog from '@southneuhof/is-vue-framework/components/composites/ConfirmationDialog.vue'
import Detail from '@southneuhof/is-vue-framework/components/composites/Detail.vue'
import { getSmallestChildObject } from '@/utils/common'
import type { SupportedSectionSlotEditor } from '@/features/sections/schemaAdapter'
import { resolveSlotEditorConfig } from '@/features/sections/slotEditorConfig'
import Card from '@southneuhof/is-vue-framework/components/base/Card.vue'
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'
import Spinner from '@southneuhof/is-vue-framework/components/base/Spinner.vue'

const props = defineProps({
  galleryID: {
    type: String,
    required: true,
  },
  slotConfig: {
    type: Object as PropType<SupportedSectionSlotEditor | undefined>,
    required: false,
  },
  name: {
    type: String,
    default: 'Gallery',
  },
  sectionData: {
    type: Object,
    required: true,
  },
})

const pageTranslation = inject<any>('pageTranslation')
const sectionData = inject<any>('sectionData', {})
const isOpen = ref(false)
const loading = ref(true)

function onDragChange(model: string, event: any) {
  if (!event.moved) return
  services.put(`${model}/reorder`, {
    from: event.moved.oldIndex + 1,
    to: event.moved.newIndex + 1,
    id: event.moved.element.id,
    page_translation_id: pageTranslation?.value?.id,
  })
}

const rootSectionData = computed(() => {
  let current = sectionData as any
  while (current?.parentSectionData) current = current.parentSectionData
  return current ?? null
})
const resolvedSlotConfig = computed(() =>
  resolveSlotEditorConfig(props.slotConfig, {
    slot: {
      key: props.slotConfig?.key ?? '',
      type: (props.slotConfig?.type === 'resource' ? 'gallery' : (props.slotConfig?.type ?? 'gallery')),
      order: props.slotConfig?.order ?? 0,
      many: props.slotConfig?.many ?? false,
    },
    sectionData,
    parentSectionData: sectionData?.parentSectionData ?? null,
    rootSectionData: rootSectionData.value,
  }),
)
const fields = computed(() => resolvedSlotConfig.value?.fields ?? ['title', 'description', 'media', 'url'])
const fieldsAlias = computed(() => (resolvedSlotConfig.value as any)?.fieldAliases ?? (resolvedSlotConfig.value as any)?.fieldsAlias ?? {})
const galleryMetaDependencyKey = computed(() => JSON.stringify(props.sectionData?.meta ?? {}))

const listConfig = computed(() => ({
  getAPI: 'content',
  deleteAPI: 'content',
  fields: fields.value,
  fieldsAlias: fieldsAlias.value,
  fieldsDictionary: resolvedSlotConfig.value?.fieldsDictionary as any,
  fieldsParse: resolvedSlotConfig.value?.fieldsParse as any,
  fieldsProxy: resolvedSlotConfig.value?.fieldsProxy as any,
  fieldsType: resolvedSlotConfig.value?.fieldsType as any,
  fieldsUnit: resolvedSlotConfig.value?.fieldsUnit as any,
  searchParameters: { gallery_id: props.galleryID, sort: 'asc', sort_by: 'order', limit: 1000 },
  onDragChange: resolvedSlotConfig.value?.onDragChange ?? ((event: any) => onDragChange('content', event)),
}))

const createFormConfig = computed(() => ({
  fields: fields.value,
  targetAPI: 'content',
  fieldsAlias: fieldsAlias.value,
  inputConfig: {
    content: { type: 'rich-text' },
    ...(resolvedSlotConfig.value?.inputConfig ?? {}),
  },
  beforeSubmit: ({ formData }: { formData: Record<string, unknown> }) => {
    const { meta: _meta, ...payload } = formData
    return payload
  },
  extraData: {
    ...(resolvedSlotConfig.value?.defaultValues ?? {}),
    gallery_id: props.galleryID,
    page_translation_id: pageTranslation?.value?.id,
  },
}))

const updateFormConfig = computed(() => ({
  fields: fields.value,
  targetAPI: 'content',
  fieldsAlias: fieldsAlias.value,
  inputConfig: {
    content: { type: 'rich-text' },
    ...(resolvedSlotConfig.value?.inputConfig ?? {}),
  },
  beforeSubmit: ({ formData }: { formData: Record<string, unknown> }) => {
    const { meta: _meta, ...payload } = formData
    return payload
  },
  extraData: { page_translation_id: pageTranslation?.value?.id },
}))

const detailConfig = computed(() => ({
  fields: fields.value,
  fieldsAlias: fieldsAlias.value,
  fieldsDictionary: resolvedSlotConfig.value?.fieldsDictionary as any,
  fieldsParse: resolvedSlotConfig.value?.fieldsParse as any,
  fieldsProxy: resolvedSlotConfig.value?.fieldsProxy as any,
  fieldsType: resolvedSlotConfig.value?.fieldsType as any,
  fieldsUnit: resolvedSlotConfig.value?.fieldsUnit as any,
}))

const currentView = ref<'list' | 'create' | 'update' | 'detail'>('list')
const activeData = ref<any>(null)
const topmostSection = getSmallestChildObject(sectionData, 'parentSectionData')
</script>

<template>
  <Card>
    <div class="flex flex-row items-center justify-between gap-4">
      <div class="flex flex-row items-center gap-2">
        <Icon name="gallery"></Icon>
        <p class="text-xl font-semibold">{{ name }}</p>
        <div v-if="loading" class="h-[34px] flex items-center justify-center">
          <Spinner />
        </div>
        <Button
          v-if="isOpen && currentView !== 'list'"
          variant="tonal"
          class="ml-4"
          @click="() => {
            currentView = 'list'
            activeData = null
          }"
        >
          <template #icon>
            <Icon name="arrow-left-s"></Icon>
          </template>
          Kembali
        </Button>
      </div>
      <div v-if="!loading" class="flex flex-row items-center gap-4">
        <Button v-if="isOpen && currentView === 'list' && pageTranslation?.status_code === 'DRAFT'" class="h-[34px]" @click="() => (currentView = 'create')">
          <template #icon>
            <Icon name="add"></Icon>
          </template>
          Tambah
        </Button>
        <Button variant="standard" kind="icon" aria-label="Toggle gallery" @click="() => (isOpen = !isOpen)">
          <template #icon>
            <Icon :name="isOpen ? 'arrow-up-s' : 'arrow-down-s'"></Icon>
          </template>
        </Button>
      </div>
    </div>
    <div v-show="isOpen" class="flex flex-col gap-4">
      <Transition name="fade" mode="out-in">
        <div :key="currentView" class="flex flex-col gap-4">
          <template v-if="currentView === 'list'">
            <Table draggable :key="keyManager().value[`table-gallery-${galleryID}`]" v-bind="listConfig" :onDataLoaded="() => (loading = false)" :disabled="pageTranslation?.status_code !== 'DRAFT'">
              <template #list-rowActions="{ data }">
                <div class="flex flex-row items-center gap-2">
                  <Icon v-if="pageTranslation?.status_code === 'DRAFT'" class="mr-3 cursor-move" name="draggable"></Icon>
                  <Button kind="icon" color="info" aria-label="Lihat detail" @click="() => { activeData = data; currentView = 'detail' }">
                    <template #icon>
                      <Icon name="information"></Icon>
                    </template>
                  </Button>
                  <template v-if="pageTranslation?.status_code === 'DRAFT'">
                    <Button kind="icon" color="warning" aria-label="Ubah data" @click="() => { activeData = data; currentView = 'update' }">
                      <template #icon>
                        <Icon name="edit"></Icon>
                      </template>
                    </Button>
                    <ConfirmationDialog
                      :onConfirm="() => {
                        services.delete('content', { id: data.id }).then(() => {
                          toast.success('Berhasil menghapus data!')
                          keyManager().triggerChange(`table-gallery-${galleryID}`)
                          keyManager().triggerChange(`section-update-time-${topmostSection.id}`)
                        })
                      }"
                    >
                      <template #trigger>
                        <Button kind="icon" color="error" aria-label="Hapus data">
                          <template #icon>
                            <Icon name="delete-bin"></Icon>
                          </template>
                        </Button>
                      </template>
                    </ConfirmationDialog>
                  </template>
                </div>
              </template>
            </Table>
          </template>
          <template v-else-if="currentView === 'create'">
            <Form
              :key="`gallery-create-${galleryID}-${galleryMetaDependencyKey}`"
              v-bind="createFormConfig"
              :getInitialData="async () => ({ ...(resolvedSlotConfig?.defaultValues ?? {}), meta: props.sectionData.meta  })"
              :disabled="pageTranslation?.status_code !== 'DRAFT'"
              :onSuccess="() => {
                toast.success('Berhasil menambahkan data!')
                keyManager().triggerChange(`table-gallery-${galleryID}`)
                keyManager().triggerChange(`section-update-time-${topmostSection.id}`)
                currentView = 'list'
              }"
            />
          </template>
          <template v-else-if="currentView === 'update'">
            <Form
              :key="`gallery-update-${activeData?.id ?? 'new'}-${galleryMetaDependencyKey}`"
              v-bind="updateFormConfig"
              formType="update"
              :getInitialData="async () => JSON.parse(JSON.stringify({ ...(activeData ?? {}), meta: props.sectionData.meta }))"
              :disabled="pageTranslation?.status_code !== 'DRAFT'"
              :onSuccess="() => {
                toast.success('Berhasil mengubah data!')
                keyManager().triggerChange(`table-gallery-${galleryID}`)
                keyManager().triggerChange(`section-update-time-${topmostSection.id}`)
                currentView = 'list'
              }"
            />
          </template>
          <template v-else-if="currentView === 'detail'">
            <Detail :data="activeData" v-bind="detailConfig" />
          </template>
        </div>
      </Transition>
    </div>
  </Card>
</template>
