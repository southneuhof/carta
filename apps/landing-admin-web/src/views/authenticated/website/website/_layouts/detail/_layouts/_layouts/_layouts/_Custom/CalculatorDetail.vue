<script setup lang="ts">
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
      <Icon>calculate</Icon>
      <p>Lihat pengaturan kalkulator</p>
    </div>
    <Icon>chevron_right</Icon>
  </Card>
  <Card v-else class="flex-row items-center gap-2" color="warning">
    <Icon>info</Icon>
    <p>Pilih tipe kalkulator dari pengaturan metadata</p>
  </Card>
</template>