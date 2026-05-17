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
const isOpen = ref(false)
const loading = ref(true)

function onDragChange(model: string, event: any) {
  if (!event.moved) return
  services.put(`${model}/reorder`, {
    old_order: event.moved.oldIndex + 1,
    new_order: event.moved.newIndex + 1,
    id: event.moved.element.id,
    page_translation_id: pageTranslation?.value?.id,
  })
}

const fields = computed(() => props.slotConfig?.fields ?? ['title', 'description', 'media', 'url'])
const fieldsAlias = computed(() => props.slotConfig?.fieldAliases ?? {})

const listConfig = computed(() => ({
  getAPI: 'content',
  deleteAPI: 'content',
  fields: fields.value,
  fieldsAlias: fieldsAlias.value,
  searchParameters: { gallery_id: props.galleryID, sort: 'asc', sort_by: 'order', limit: 1000 },
  onDragChange: (event: any) => onDragChange('content', event),
}))

const createFormConfig = {
  fields: fields.value,
  targetAPI: 'content',
  fieldsAlias: fieldsAlias.value,
  inputConfig: {
    content: { type: 'rich-text' },
  },
  extraData: { gallery_id: props.galleryID, page_translation_id: pageTranslation?.value?.id },
}

const updateFormConfig = {
  fields: fields.value,
  targetAPI: 'content',
  fieldsAlias: fieldsAlias.value,
  inputConfig: {
    content: { type: 'rich-text' },
  },
  extraData: { page_translation_id: pageTranslation?.value?.id },
}

const detailConfig = {
  fields: fields.value,
  fieldsAlias: fieldsAlias.value,
}

const currentView = ref<'list' | 'create' | 'update' | 'detail'>('list')
const activeData = ref<any>(null)
const sectionData = inject<any>('sectionData', {})
const topmostSection = getSmallestChildObject(sectionData, 'parentSectionData')
</script>

<template>
  <Card>
    <div class="flex flex-row items-center justify-between gap-4">
      <div class="flex flex-row items-center gap-2">
        <Icon>category</Icon>
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
          <Icon>chevron_left</Icon>Kembali
        </Button>
      </div>
      <div v-if="!loading" class="flex flex-row items-center gap-4">
        <Button v-if="isOpen && currentView === 'list' && pageTranslation?.status_code === 'DRAFT'" class="h-[34px]" @click="() => (currentView = 'create')"><Icon>add</Icon>Tambah</Button>
        <Button variant="standard" @click="() => (isOpen = !isOpen)"><Icon>{{ isOpen ? 'expand_less' : 'expand_more' }}</Icon></Button>
      </div>
    </div>
    <div v-show="isOpen" class="flex flex-col gap-4">
      <Transition name="fade" mode="out-in">
        <div :key="currentView" class="flex flex-col gap-4">
          <template v-if="currentView === 'list'">
            <Table draggable :key="keyManager().value[`table-gallery-${galleryID}`]" v-bind="listConfig" :onDataLoaded="() => (loading = false)" :disabled="pageTranslation?.status_code !== 'DRAFT'">
              <template #list-rowActions="{ data }">
                <div class="flex flex-row items-center gap-2">
                  <Icon v-if="pageTranslation?.status_code === 'DRAFT'" class="mr-3 cursor-move">drag_indicator</Icon>
                  <Button color="info" @click="() => { activeData = data; currentView = 'detail' }"><Icon>info</Icon></Button>
                  <template v-if="pageTranslation?.status_code === 'DRAFT'">
                    <Button color="warning" @click="() => { activeData = data; currentView = 'update' }"><Icon>edit</Icon></Button>
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
                        <Button color="error"><Icon>delete_forever</Icon></Button>
                      </template>
                    </ConfirmationDialog>
                  </template>
                </div>
              </template>
            </Table>
          </template>
          <template v-else-if="currentView === 'create'">
            <Form
              v-bind="createFormConfig"
              :getInitialData="async () => ({ meta: props.sectionData.meta  })"
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
              v-bind="updateFormConfig"
              formType="update"
              :getInitialData="async () => JSON.parse(JSON.stringify(activeData))"
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
