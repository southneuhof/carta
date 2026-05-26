<script setup lang="ts">
import Card from '@southneuhof/is-vue-framework/components/base/Card.vue'
import Form from '@southneuhof/is-vue-framework/components/composites/Form.vue'
import { toast } from 'vue-sonner'
import services from '@/utils/services'
import type { PropType } from 'vue'

const props = defineProps({
  job: { type: Object as PropType<Record<string, any>>, required: true },
  language: { type: Object, required: true },
})

const { data: jobTranslation } = await services.detail('jobTranslation', [props.job.id, props.language.code])
</script>

<template>
  <Card>
    <div class="mb-4 flex flex-row items-center justify-between">
      <p class="text-xl">Detail Lowongan</p>
    </div>
    <Form
      targetAPI="jobTranslation"
      :fields="['name', 'minimum_education', 'location', 'description', 'qualification']"
      :inputConfig="{
        name: { type: 'text', props: { required: true } },
        minimum_education: { type: 'text', props: { required: true } },
        location: { type: 'text', props: { required: true } },
        description: { type: 'rich-text' },
        qualification: { type: 'rich-text' },
      }"
      :fieldsAlias="{
        name: 'Nama Lowongan',
        minimum_education: 'Pendidikan Minimum',
        location: 'Lokasi',
        description: 'Deskripsi',
        qualification: 'Kualifikasi',
      }"
      :getDetailData="async () => JSON.parse(JSON.stringify(jobTranslation))"
      formType="update"
      :searchParameters="{ job_id: props.job.id, language: props.language.code }"
      :onSuccess="
        () => {
          toast.success('Berhasil menyimpan lowongan!')
        }
      "
    />
  </Card>
</template>
