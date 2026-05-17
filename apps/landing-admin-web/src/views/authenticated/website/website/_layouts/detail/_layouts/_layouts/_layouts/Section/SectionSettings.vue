<script setup lang="ts">
import Tabs from '@southneuhof/is-vue-framework/components/base/Tabs.vue';
import Form from '@southneuhof/is-vue-framework/components/composites/Form.vue';
import { keyManager } from '@/stores/keyManager';
import { toast } from 'vue-sonner';
import { defineAsyncComponent, inject, ref } from 'vue';

const activeTabIndex = ref(0)
const sectionConfig = inject<any>('sectionConfig', {})

const tabConfig = [
  {name: 'Section', component: defineAsyncComponent(() => import('./_layouts/SectionDetail.vue'))},
  sectionConfig.meta ? {name: 'Metadata', component: defineAsyncComponent(() => import('./_layouts/SectionMetaEditor.vue'))} : null
].filter(item => !!item)
</script>

<template>
  <div class="flex flex-col gap-4">
    <p class="text-xl font-bold">Pengaturan Section</p>
    <div :class="{'hidden': tabConfig.length == 1}">
      <Tabs v-model="activeTabIndex" :config="tabConfig" ignoreQuery/>
    </div>
    <component v-if="activeTabIndex != null" :is="tabConfig[activeTabIndex].component"/>
  </div>
</template>