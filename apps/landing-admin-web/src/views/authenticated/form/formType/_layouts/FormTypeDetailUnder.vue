<script setup lang="ts">
import Tabs from '@southneuhof/is-vue-framework/components/base/Tabs.vue';
import { keyManager } from '@/stores/keyManager';
import { defineAsyncComponent, inject, ref } from 'vue';

  const tabConfig = [
    {name: 'Formulir', component: defineAsyncComponent(() => import('./_layouts/FormFieldsConfig.vue'))},
    {name: 'Kontrol Akses', component: defineAsyncComponent(() => import('./_layouts/MappingRoleFormType.vue'))},
  ]
  const activeTabIndex = ref()
</script>

<template>
  <div class="flex flex-col gap-4">
    <Tabs :config="tabConfig" v-model="activeTabIndex"/>
    <component v-if="activeTabIndex != null" :key="`${activeTabIndex}${keyManager().value['form-type-detail-under']}`" :is="tabConfig[activeTabIndex].component"/>
  </div>
</template>