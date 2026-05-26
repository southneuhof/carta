<script setup lang="ts">
import Tabs from '@southneuhof/is-vue-framework/components/base/Tabs.vue'
import { ref } from 'vue'
import { languages } from '@/utils/common'
import JobEditor from './_layouts/JobEditor.vue'
import { keyManager } from '@/stores/keyManager'

defineProps({ data: { type: Object, required: true } })
const activeTabIndex = ref(0)
</script>

<template>
  <div class="flex flex-col gap-4">
    <Tabs :config="languages" name="jobLanguageMapUnder_language_tab" v-model="activeTabIndex" />
    <JobEditor
      v-if="activeTabIndex != null"
      :job="data"
      :language="languages[activeTabIndex]"
      :key="`${activeTabIndex}${keyManager().value['job-translation-detail-under']}`"
    />
  </div>
</template>
