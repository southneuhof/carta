<script setup lang="ts">
import Form from '@southneuhof/is-vue-framework/components/composites/Form.vue';
import { keyManager } from '@/stores/keyManager';
import { toast } from 'vue-sonner';
import { getSmallestChildObject } from '@/utils/common';
import { inject } from 'vue';

const sectionData = inject<any>('sectionData', {})
const pageTranslation = inject<Record<string, any>>('pageTranslation')

const topmostSection = getSmallestChildObject(sectionData, 'parentSectionData')
</script>

<template>
  <Form
    :fields="['name', 'visible', 'description']"
    :getData="async () => JSON.parse(JSON.stringify(sectionData))"
    formType="update"
    targetAPI="section"
    :disabled="pageTranslation?.status_code !== 'DRAFT'"
    :onSuccess="() => {
      toast.success('Berhasil mengubah data!')
      keyManager().triggerChange(`section-${sectionData.id}`)
      keyManager().triggerChange(`section-update-time-${topmostSection.id}`)
    }"
    :extraData="{page_translation_id: pageTranslation?.value?.id}"
  />
</template>