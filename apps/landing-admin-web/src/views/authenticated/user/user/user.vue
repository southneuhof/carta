<script setup lang="ts">
import CRUDComposite from '@southneuhof/is-vue-framework/components/composites/CRUDComposite.vue';
import { userModel } from '@/models';
</script>

<template>
  <CRUDComposite :config="userModel"/>
</template>
