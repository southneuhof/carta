<script setup lang="ts">
import MenuItemDetail from './_layouts/detail/MenuItemDetail.vue';
import MenuItemList from './_layouts/list/MenuItemList.vue';

</script>

<template>
  <div>
    <Transition name="fade" mode="out-in">
      <MenuItemList v-if="!$route.query[`${String($route.name)}_view`]"/>
      <MenuItemDetail v-else-if="$route.query[`${String($route.name)}_view`] === 'detail' && $route.query[`${String($route.name)}_id`]"/>
    </Transition>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.1s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(2%);
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: translateY(0%);
}
</style>