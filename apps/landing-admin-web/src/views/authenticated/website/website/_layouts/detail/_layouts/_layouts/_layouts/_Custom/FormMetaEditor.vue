<script setup lang="ts">
import Card from '@southneuhof/is-vue-framework/components/base/Card.vue'
import Form from '@southneuhof/is-vue-framework/components/composites/Form.vue'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'
import { keyManager } from '@/stores/keyManager'
import { getSmallestChildObject } from '@/utils/common'
import { computed, inject, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'

const props = defineProps({
  sectionData: {
    type: Object,
    required: true,
  },
})

const pageTranslation = inject<Record<string, any>>('pageTranslation')
const topmostSection = computed(() => getSmallestChildObject(props.sectionData, 'parentSectionData'))

async function submitFormType({ payload }: { payload: object }) {
  const { default: services } = await import('@/utils/services')
  const mergedMeta = {
    ...(props.sectionData?.meta || {}),
    form_type_id: typeof (payload as Record<string, unknown>).form_type_id === 'string' ? String((payload as Record<string, unknown>).form_type_id) : '',
  }

  return services.update('section', {
    ...props.sectionData,
    meta: mergedMeta,
  })
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <Card v-if="!sectionData?.meta?.form_type_id" class="flex-row items-center gap-2" color="warning">
      <Icon name="information" />
      <p>Pilih tipe formulir untuk mengaktifkan field submission publik.</p>
    </Card>

    <Card>
      <Form
        :fields="['form_type_id']"
        :fieldsAlias="{ form_type_id: 'Form Type' }"
        :inputConfig="{
          form_type_id: {
            type: 'select',
            props: {
              getAPI: 'formType',
              clearable: true,
            },
          },
        }"
        :getDetailData="async () => ({ form_type_id: sectionData?.meta?.form_type_id ?? '' })"
        formType="update"
        :onSubmit="submitFormType"
        :onSuccess="() => {
          toast.success('Berhasil menyimpan form type!')
          keyManager().triggerChange(`section-${sectionData.id}`)
          keyManager().triggerChange(`section-update-time-${topmostSection.id}`)
        }"
        :disabled="pageTranslation?.status_code !== 'DRAFT'"
      />
    </Card>
  </div>
</template>
