<script setup lang="ts">
import Card from '@southneuhof/is-vue-framework/components/base/Card.vue'
import Tabs from '@southneuhof/is-vue-framework/components/base/Tabs.vue'
import Form from '@southneuhof/is-vue-framework/components/composites/Form.vue'
import { languages } from '@/utils/common'
import { ref } from 'vue'
import AdBannerEditor from './_layouts/AdBannerEditor.vue'
import { keyManager } from '@/stores/keyManager'
import { toast } from 'vue-sonner'
import adBannerLanguageMapModel from '@client/data-model/models/adBannerLanguageMap.model'
import { buildFormConfig } from '@southneuhof/is-data-model'

const props = defineProps({
  data: { type: Object, required: true },
})

const activeTabIndex = ref(0)
const updateConfig = buildFormConfig(adBannerLanguageMapModel, 'update')
</script>

<template>
  <div class="flex flex-col gap-4">
    <Card>
      <Form
        :fields="['article_language_map_code']"
        :targetAPI="updateConfig.targetAPI"
        :getAPI="adBannerLanguageMapModel.name"
        :fieldsAlias="updateConfig.fieldsAlias"
        :inputConfig="updateConfig.inputConfig"
        formType="update"
        :getInitialData="async () => JSON.parse(JSON.stringify(data))"
        :onSuccess="() => {
          toast.success('Berhasil menyimpan data!')
        }"
      />
    </Card>
    <Tabs :config="languages" v-model="activeTabIndex" name="ad_banner_language" />
    <AdBannerEditor v-if="activeTabIndex != null" :data="data" :language="languages[activeTabIndex]" :key="`${keyManager().value['articleCategoryEditor']}${activeTabIndex}`" />
  </div>
</template>
