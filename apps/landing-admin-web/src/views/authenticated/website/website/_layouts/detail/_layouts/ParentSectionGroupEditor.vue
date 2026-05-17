<script setup lang="ts">
import { keyManager } from '@/stores/keyManager'
import { toast } from 'vue-sonner'
import services from '@/utils/services'
import SectionEditor from './_layouts/SectionEditor.vue'
import SectionAddWizard from './_layouts/SectionAddWizard.vue'
import Draggable from 'vuedraggable'
import { inject, ref } from 'vue'
import { buildCreateSectionPayload } from '@/features/sections/schemaAdapter'
import Spinner from '@southneuhof/is-vue-framework/components/base/Spinner.vue'

const props = defineProps({
  sectionGroupID: {
    type: String,
    required: true,
  },
})

const pageTranslation = inject<any>('pageTranslation')
const { data: sectionGroupData } = await services.detail('sectionGroup', props.sectionGroupID)
const sections = ref(sectionGroupData.sections ?? [])

async function createSection(schemaCode: string) {
  const payload = buildCreateSectionPayload({
    schemaCode,
    sectionGroupId: sectionGroupData.id,
    pageTranslationId: pageTranslation?.value?.id,
  })
  await services.post('sectionGroup/addSection', payload)
  toast.success('Berhasil menambahkan data!')
  keyManager().triggerChange(`sectionGroup-${props.sectionGroupID}`)
}

const isLoadingReordering = ref(false)

function handleSectionReorder(event: any) {
  isLoadingReordering.value = true
  if (!event.moved) return
  if (event.moved.newIndex !== event.moved.oldIndex) {
    services
      .put('section/reorder', {
        old_order: event.moved.oldIndex + 1,
        new_order: event.moved.newIndex + 1,
        id: event.moved.element.id,
        page_translation_id: pageTranslation?.value?.id,
      })
      .then(() => {
        isLoadingReordering.value = false
      })
      .catch(() => {
        toast.error('Gagal mengubah urutan!')
        isLoadingReordering.value = false
      })
  }
}
</script>

<template>
  <Transition name="fade" appear>
    <div class="flex flex-col gap-4">
      <p v-if="sections.length === 0" class="text-center text-muted">Tidak ada data</p>
      <Suspense v-else :timeout="0">
        <template #fallback>
          <div class="h-fit w-full flex items-center justify-center"><Spinner /></div>
        </template>
        <Draggable v-model="sections" class="flex flex-col gap-2" item-key="id" :disabled="isLoadingReordering" @change="handleSectionReorder">
          <template #item="{ element: item, index }">
            <div :key="index">
              <SectionEditor :sectionID="item.id" :key="keyManager().value[`section-${item.id}`]" />
            </div>
          </template>
        </Draggable>
      </Suspense>
      <SectionAddWizard v-if="pageTranslation?.status_code === 'DRAFT'" :onSubmit="createSection" />
    </div>
  </Transition>
</template>
