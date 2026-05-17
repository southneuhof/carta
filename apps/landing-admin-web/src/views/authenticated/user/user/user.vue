<script setup lang="ts">
import CRUDComposite from '@southneuhof/is-vue-framework/components/composites/CRUDComposite.vue';
import userModel from '@client/data-model/models/user.model'
</script>

<template>
  <CRUDComposite :config="userModel"/>
</template>
