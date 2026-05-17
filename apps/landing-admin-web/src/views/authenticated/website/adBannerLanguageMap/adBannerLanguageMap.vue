<script setup lang="ts">
import adBannerLanguageMapModel from '@client/data-model/models/adBannerLanguageMap.model'
import CRUDComposite from '@southneuhof/is-vue-framework/components/composites/CRUDComposite.vue'
import AdBannerLanguageMapDetailUnder from './_layouts/AdBannerLanguageMapDetailUnder.vue'
</script>

<template>
  <CRUDComposite :config="adBannerLanguageMapModel">
    <template #detail-under="{ data }">
      <AdBannerLanguageMapDetailUnder :data="data" />
    </template>
  </CRUDComposite>
</template>
