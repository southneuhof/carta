<script setup lang="ts">
import Spinner from '@southneuhof/is-vue-framework/components/base/Spinner.vue'
import Card from '@southneuhof/is-vue-framework/components/base/Card.vue'
import services from '@/utils/services'
import { inject, ref } from 'vue'
import SectionEditor from '../../SectionEditor.vue'
import { keyManager } from '@/stores/keyManager'
import Draggable from 'vuedraggable'
import { toast } from 'vue-sonner'
import type { MatchedSchemaSlot, SupportedSectionSlotEditorContext } from '@/features/sections/schemaAdapter'
import type { SectionData } from '../../SectionEditor.vue'

const props = defineProps<{
  sectionGroupID: string
  nestedParentMatch?: MatchedSchemaSlot | SupportedSectionSlotEditorContext
  parentSectionData?: SectionData | null
}>()

const { data: sectionGroupData } = await services.detail('sectionGroup', props.sectionGroupID)
const activeSectionIndex = ref(sectionGroupData.sections.length ? 0 : undefined)
const pageTranslation = inject<any>('pageTranslation')

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
  <div class="flex flex-col gap-4">
    <p v-if="!sectionGroupData.sections.length" class="h-[20px] text-muted italic">Tidak ada section dalam section group ini.</p>
    <Draggable v-model="sectionGroupData.sections" direction="horizontal" item-key="id" class="flex flex-row items-center gap-2" :disabled="isLoadingReordering" @change="handleSectionReorder">
      <template #item="{ element, index }">
        <Card class="flex flex-row items-center gap-2" :color="activeSectionIndex === index ? 'primary' : 'surface'" @click="() => (activeSectionIndex = index)">
          <p>{{ element.name }}</p>
        </Card>
      </template>
    </Draggable>
    <Suspense :timeout="0">
      <template #fallback>
        <div class="h-fit w-full flex items-center justify-center"><Spinner /></div>
      </template>
      <SectionEditor
        v-if="activeSectionIndex != null"
        asChild
        :sectionID="sectionGroupData.sections[activeSectionIndex].id"
        :nestedParentMatch="nestedParentMatch"
        :parentSectionDataOverride="parentSectionData"
        :key="`${keyManager().value[`section-${sectionGroupData.sections[activeSectionIndex].id}`]}${activeSectionIndex}`"
      />
    </Suspense>
  </div>
</template>
