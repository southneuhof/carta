<script setup lang="ts">
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'
import Card from '@southneuhof/is-vue-framework/components/base/Card.vue'
 const props = defineProps({
  config: {
    type: Object,
    required: true
  },
  sectionData: {
    type: Object,
    required: true
  }
})
</script>

<template>
  <Card
    v-if="sectionData.meta.form_type_id"

    class="flex-row items-center gap-2 justify-between"
    color="infoContainer"
    @click="() => $router.push({name: 'formType', query: {'formType_view': 'detail', 'formType_id': sectionData.meta.form_type_id}})"
  >
    <div class="flex flex-row items-center gap-2">
      <Icon>article</Icon>
      <p>Lihat pengaturan formulir</p>
    </div>
    <Icon>chevron_right</Icon>
  </Card>
  <Card v-else class="flex-row items-center gap-2" color="warning">
    <Icon>info</Icon>
    <p>Pilih tipe formulir dari pengaturan metadata</p>
  </Card>
</template>