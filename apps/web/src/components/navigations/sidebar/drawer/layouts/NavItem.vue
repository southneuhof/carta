<script setup lang="ts">
import { titleCase } from '@southneuhof/is-vue-framework/utils/string'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'

const props = defineProps({
  active: {
    type: Boolean,
    required: true,
  },
  route: {
    type: Object,
    required: true,
  },
})

const hasNestedRoutes = (route: any) => {
  if (!route?.routes) return false
  return route.routes.filter((item: any) => !item.separator).length > 1
}
</script>

<template>
  <button
    class="overlay flex w-full min-w-full flex-row items-center justify-between gap-4 rounded-full p-4"
    :class="
      props.active
        ? 'bg-secondary-container p-4 text-on-secondary-container after:hover:bg-on-secondary-container/[8%] after:active:bg-on-secondary-container/[12%]    '
        : 'text-on-surface after:hover:bg-on-surface/[8%] after:active:bg-on-surface/[12%]   '
    "
  >
    <div class="flex flex-row items-center gap-4">
      <Icon size="2xl" :name="props.route.icon || 'menu'" />
      <div class="text-left">{{ titleCase(props.route.title) }}</div>
    </div>
    <div v-if="hasNestedRoutes(props.route)">
      <Icon size="2xl" name="arrow-right" />
    </div>
  </button>
</template>
