<script setup lang="ts">
import Form from '@southneuhof/is-vue-framework/components/composites/Form.vue'
import { keyManager } from '@/stores/keyManager'
import { toast } from 'vue-sonner'
import { getSmallestChildObject } from '@/utils/common'
import services from '@/utils/services'
import { inject } from 'vue'

const sectionData = inject<any>('sectionData', {})
const sectionConfig = inject<any>('sectionConfig', {})
const pageTranslation = inject<Record<string, any>>('pageTranslation')

async function submitSectionMetadata(payload: object, targetAPI: string, type: 'create' | 'update', searchParameters?: object): Promise<object> {
  try {
    return await services.update(targetAPI, { ...sectionData, meta: payload, ...(searchParameters || {}), page_translation_id: pageTranslation?.value?.id })
  } catch (err: any) {
    throw new Error(err)
  }
}

const topmostSection = getSmallestChildObject(sectionData, 'parentSectionData')
</script>

<template>
  <div class="flex flex-col gap-4">
    <Form
      v-bind="sectionConfig.meta"
      :getInitialData="async () => {
        const metaDefaults = sectionConfig.meta?.getInitialData ? await sectionConfig.meta.getInitialData() : {}
        return JSON.parse(JSON.stringify({ ...metaDefaults, ...sectionData.meta }))
      }"
      formType="update"
      targetAPI="section"
      :onSubmit="submitSectionMetadata"
      :onSuccess="() => {
        toast.success('Berhasil mengubah data!')
        keyManager().triggerChange(`section-${sectionData.id}`)
        keyManager().triggerChange(`section-update-time-${topmostSection.id}`)
      }"
      :disabled="pageTranslation?.status_code !== 'DRAFT'"
    />
  </div>
</template>
