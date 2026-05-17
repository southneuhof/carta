<script setup lang="ts">
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue';
import Tabs from '@southneuhof/is-vue-framework/components/base/Tabs.vue';
import { computed, defineAsyncComponent, inject, ref, unref } from 'vue';

const activeTabIndex = ref(0)
const injectedSectionConfig = inject<any>('sectionConfig', {})
const sectionConfig = computed(() => unref(injectedSectionConfig) ?? {})

const tabConfig = computed(() => [
  {name: 'Section', component: defineAsyncComponent(() => import('./_layouts/SectionDetail.vue'))},
  sectionConfig.value.meta ? {name: 'Metadata', component: defineAsyncComponent(() => import('./_layouts/SectionMetaEditor.vue'))} : null
].filter(item => !!item))
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-row items-center gap-2">
      <Icon name="settings"></Icon>
      <p class="text-xl font-bold">Pengaturan Section</p>
    </div>
    <div :class="{'hidden': tabConfig.length == 1}">
      <Tabs v-model="activeTabIndex" :config="tabConfig" ignoreQuery/>
    </div>
    <component v-if="activeTabIndex != null" :is="tabConfig[activeTabIndex].component"/>
  </div>
</template>
