<script setup lang="ts">
import CRUDComposite from '@southneuhof/is-vue-framework/components/composites/CRUDComposite.vue'
import companyProfileModel from '@client/data-model/models/companyProfile.model'
</script>

<template>
  <div class="flex flex-col gap-4">
    <CRUDComposite :config="companyProfileModel" />
  </div>
</template>
