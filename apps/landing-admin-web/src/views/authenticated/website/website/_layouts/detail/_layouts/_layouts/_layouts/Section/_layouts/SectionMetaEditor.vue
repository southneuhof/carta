<script setup lang="ts">
import Form from '@southneuhof/is-vue-framework/components/composites/Form.vue'
import { keyManager } from '@/stores/keyManager'
import { toast } from 'vue-sonner'
import { getSmallestChildObject } from '@/utils/common'
import services from '@/utils/services'
import { computed, inject, unref } from 'vue'

const injectedSectionData = inject<any>('sectionData', {})
const injectedSectionConfig = inject<any>('sectionConfig', {})
const sectionData = computed(() => unref(injectedSectionData) ?? {})
const sectionConfig = computed(() => unref(injectedSectionConfig) ?? {})
const pageTranslation = inject<Record<string, any>>('pageTranslation')

async function submitSectionMetadata({ payload, method, targetAPI, type, searchParameters }: { payload: object; method?: 'put' | 'post'; targetAPI: string; type: 'create' | 'update'; searchParameters?: object }): Promise<object> {
  try {
    const body = { ...sectionData.value, meta: payload, ...(searchParameters || {}), page_translation_id: pageTranslation?.value?.id }

    return await services.update(targetAPI, body)
  } catch (err: any) {
    console.error(err)
    throw err
  }
}

const topmostSection = computed(() => getSmallestChildObject(sectionData.value, 'parentSectionData'))
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
