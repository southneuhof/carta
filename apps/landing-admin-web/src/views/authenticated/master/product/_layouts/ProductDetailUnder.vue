<script setup lang="ts">
import Tabs from '@southneuhof/is-vue-framework/components/base/Tabs.vue'
import { ref } from 'vue'
import { languages } from '@/utils/common'
import ProductEditor from './_layouts/ProductEditor.vue'
import { keyManager } from '@/stores/keyManager'

defineProps({ data: { type: Object, required: true } })
const activeTabIndex = ref(0)
</script>

<template>
  <div class="flex flex-col gap-4">
    <Tabs :config="languages" name="productLanguageMapUnder_language_tab" v-model="activeTabIndex" />
    <ProductEditor
      v-if="activeTabIndex != null"
      :product="data"
      :language="languages[activeTabIndex]"
      :key="`${activeTabIndex}${keyManager().value['product-translation-detail-under']}`"
    />
  </div>
</template>
