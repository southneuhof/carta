<script setup lang="ts">
import Spinner from '@southneuhof/is-vue-framework/components/base/Spinner.vue'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'
import Card from '@southneuhof/is-vue-framework/components/base/Card.vue'
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue'
import { keyManager } from '@/stores/keyManager'
import { toast } from 'vue-sonner'
import services from '@/utils/services'
import { inject, ref } from 'vue'
import SectionGroupEditorSections from './SectionGroupEditorSections.vue'
import SectionAddWizard from '../../SectionAddWizard.vue'
import { buildCreateSectionPayload } from '@/features/sections/schemaAdapter'

const props = defineProps<{
  sectionGroupID: string
}>()

const pageTranslation = inject<any>('pageTranslation')
const isOpen = ref(false)

async function createSection(schemaCode: string) {
  const payload = buildCreateSectionPayload({
    schemaCode,
    sectionGroupId: props.sectionGroupID,
    pageTranslationId: pageTranslation?.value?.id,
  })

  await services.post('sectionGroup/addSection', payload)
  toast.success('Berhasil menambahkan data!')
  keyManager().triggerChange(`sectionGroup-${props.sectionGroupID}`)
}
</script>

<template>
  <Card class="flex flex-col gap-4 bg-transparent outline outline-1 outline-primary">
    <div class="flex flex-row items-center justify-between gap-4">
      <div class="flex flex-row items-center gap-2">
        <Icon>folder_copy</Icon>
        <p class="text-xl font-semibold">Section Group</p>
      </div>
      <div class="flex flex-row items-center gap-4">
        <SectionAddWizard v-if="isOpen && pageTranslation?.status_code === 'DRAFT'" :onSubmit="createSection" />
        <Button variant="standard" @click="() => (isOpen = !isOpen)"><Icon>{{ isOpen ? 'expand_less' : 'expand_more' }}</Icon></Button>
      </div>
    </div>
    <Suspense v-if="isOpen" :timeout="0">
      <template #fallback>
        <Spinner />
      </template>
      <SectionGroupEditorSections :sectionGroupID="sectionGroupID" :key="keyManager().value[`sectionGroup-${sectionGroupID}`]" />
    </Suspense>
  </Card>
</template>
