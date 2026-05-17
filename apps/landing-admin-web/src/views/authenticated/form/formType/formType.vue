<script setup lang="ts">
import CRUDComposite from '@southneuhof/is-vue-framework/components/composites/CRUDComposite.vue';
import formTypeModel from '@client/data-model/models/formType.model'
import FormTypeDetailUnder from './_layouts/FormTypeDetailUnder.vue';


</script>

<template>
  <CRUDComposite :config="formTypeModel">
    <template #detail-under>
      <FormTypeDetailUnder/>
    </template>
  </CRUDComposite>
</template>
