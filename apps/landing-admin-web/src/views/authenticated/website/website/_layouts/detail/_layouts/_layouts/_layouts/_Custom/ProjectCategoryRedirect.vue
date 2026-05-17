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
  <div class="flex flex-col gap-4">
    <p class="text-xl">Kategori Proyek</p>
    <Card

      class="flex-row items-center gap-2 justify-between"
      color="infoContainer"
      @click="() => $router.push({name: 'collection'})"
    >
      <div class="flex flex-row items-center gap-2">
        <Icon>article</Icon>
        <p>Lihat pengaturan kategori proyek</p>
      </div>
      <Icon>chevron_right</Icon>
    </Card>
  </div>
</template>