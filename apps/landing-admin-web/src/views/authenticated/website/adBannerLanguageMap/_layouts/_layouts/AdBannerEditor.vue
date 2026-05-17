<script setup lang="ts">
import Form from '@southneuhof/is-vue-framework/components/composites/Form.vue'
import { keyManager } from '@/stores/keyManager'
import { toast } from 'vue-sonner'
import services from '@/utils/services'
import { adBannerModel } from '@/models'
import { buildFormConfig } from '@southneuhof/is-data-model'

const props = defineProps({
  data: { type: Object, required: true },
  language: { type: Object, required: true },
})

const { data } = await services.detail('adBanner', undefined, {
  ad_banner_language_map_id: props.data.id,
  language: props.language.code,
})

const updateConfig = buildFormConfig(adBannerModel, 'update')
</script>

<template>
  <Card v-if="!data" class="flex-row items-center justify-between gap-2" color="infoContainer">
    <div class="flex flex-row items-center gap-2">
      <Icon>info</Icon>
      <p>Konten promosi untuk bahasa {{ language.name }} belum dibuat.</p>
    </div>
    <Button
      @click="() =>
        services.create('adBanner', { ad_banner_language_map_id: props.data.id, language: props.language.code }).then(() => {
          keyManager().triggerChange('articleCategoryEditor')
        })"
    >
      Buat <Icon>chevron_right</Icon>
    </Button>
  </Card>
  <Card v-else>
    <Form
      :fields="['description']"
      :inputConfig="{ description: { type: 'rich-text', props: { required: true } } }"
      formType="update"
      :getInitialData="async () => JSON.parse(JSON.stringify(data))"
      :targetAPI="updateConfig.targetAPI"
      :onSuccess="() => {
        toast.success('Berhasil menyimpan data!')
      }"
    />
  </Card>
</template>
