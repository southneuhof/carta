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

    class="flex-row items-center gap-2 justify-between"
    color="infoContainer"
    @click="() => $router.push({name: 'article'})"
  >
    <div class="flex flex-row items-center gap-2">
      <Icon>article</Icon>
      <p>Lihat pengaturan manajemen artikel</p>
    </div>
    <Icon>chevron_right</Icon>
  </Card>
</template>