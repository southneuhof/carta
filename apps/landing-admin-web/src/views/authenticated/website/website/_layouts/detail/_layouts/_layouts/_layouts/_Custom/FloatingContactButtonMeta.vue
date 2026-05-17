<script setup lang="ts">
import Form from '@southneuhof/is-vue-framework/components/composites/Form.vue';
import { toast } from 'vue-sonner';
import services from '@/utils/services';
import { ref, type PropType } from 'vue';
import type { SupportedSectionSlotEditor } from '@/features/sections/schemaAdapter';

  const props = defineProps({
    objectID: {
      type: String,
      required: true
    },
    slotConfig: {
      type: Object as PropType<SupportedSectionSlotEditor | undefined>,
      required: true
    },
    sectionData: {
      type: Object,
      required: true
    }
  })

  const data = ref((await services.detail('content', props.objectID)).data)
</script>

<template>
  <Card>
    <Form
      :getData="async () => JSON.parse(JSON.stringify(data.meta))"
      :fields="[
        'email',
        'whatsapp',
        'phone',
        'facebook',
        'instagram',
        'twitter',
        'linkedin',
        'youtube',
      ]"
      :fieldsAlias="{
        email: 'Email',
        whatsapp: 'Nomor WhatsApp',
        phone: 'Nomor Telepon',
        facebook: 'Facebook',
        instagram: 'Instagram',
        twitter: 'Twitter/X',
        linkedin: 'LinkedIn',
        youtube: 'YouTube',
      }"
      :inputConfig="{
        email: {type: 'text'},
        whatsapp: {type: 'text'},
        phone: {type: 'text'},
        facebook: {type: 'text'},
        instagram: {type: 'text'},
        twitter: {type: 'text'},
        linkedin: {type: 'text'},
        youtube: {type: 'text'},
      }"
      formType="update"
      :onSubmit="async (payload) => {
        await services.update('content', {...data, meta: payload})
      }"
      :onSuccess="() => {
        toast.success('Berhasil menyimpan data!')
      }"
    />
  </Card>
</template>