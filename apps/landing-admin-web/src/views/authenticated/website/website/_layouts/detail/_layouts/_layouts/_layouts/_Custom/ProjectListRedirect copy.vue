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
    class="flex-row items-center gap-2 justify-between"
    color="infoContainer"
    @click="() => $router.push({name: 'collection'})"
  >
    <div class="flex flex-row items-center gap-2">
      <Icon name="article" />
      <p>Lihat pengaturan filter daftar proyek</p>
    </div>
    <Icon name="arrow-right-s" />
  </Card>
</template>
