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
    v-if="sectionData.meta.calculator_type_id"

    class="flex-row items-center gap-2 justify-between"
    color="infoContainer"
    @click="() => $router.push({name: 'calculatorType', query: {'calculatorType_view': 'detail', 'calculatorType_id': sectionData.meta.calculator_type_id}})"
  >
    <div class="flex flex-row items-center gap-2">
      <Icon name="calculator" />
      <p>Lihat pengaturan kalkulator</p>
    </div>
    <Icon name="arrow-right-s" />
  </Card>
  <Card v-else class="flex-row items-center gap-2" color="warning">
    <Icon name="information" />
    <p>Pilih tipe kalkulator dari pengaturan metadata</p>
  </Card>
</template>
