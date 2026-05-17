<script setup lang="ts">
import RailItem from './layouts/RailItem.vue'
import RailExpand from './layouts/RailExpand.vue'
import { modules } from '@/stores/modules'
import Logo from '@/assets/corporate/common/Logo.vue'
import { ref } from 'vue'
import { onClickOutside } from '@vueuse/core'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'

const sidebarexpand = ref<HTMLElement | null>(null)
const sidebarState = ref<{index?: number, open: boolean}>({index: undefined, open: false})

onClickOutside(
  sidebarexpand,
  (element) => {
    if (['file'].includes((element.target as HTMLElement)?.id)) return
    sidebarState.value.open = false
    sidebarState.value.index = undefined
  },
  { ignore: ['#sidebar', '#dialog'] }
)
</script>

<template>
  <div ref="sidebar" id="sidebar" class="sticky top-0 z-50 flex flex-row lg:left-0 lg:z-0 py-3 pl-3 h-screen max-h-screen bg-surface">
    <div :key="'sidebar'" class="sticky top-0 flex w-24 flex-col items-center justify-between gap-6 overflow-auto h-full rounded-xl bg-surface-container py-8">
      <Logo class="w-12"></Logo>
      <div class="flex h-full w-full flex-col items-start gap-4 overflow-auto">
        <RailItem
          v-for="(item, index) in modules().value"
          :title="item.title"
          :state="item.name === String($route.meta.moduleName) ? 2 : sidebarState.index === index ? 1 : 0"
          @click="() => {
            sidebarState.index = index
            if (item.routes.length === 1) {
              sidebarState.open = false
              const firstRoute = item.routes[0] as { name?: string }
              if ('name' in firstRoute) return $router.push({ name: firstRoute.name })
              return
            }
            sidebarState.open = true
          }"
        >
          <Icon size="3xl" :fill="item.name === String($route.meta.moduleName)" :name="item.icon as never"></Icon>
        </RailItem>
      </div>
      <RailItem
        :title="'Profil'"
        :state="sidebarState.index === -1 && sidebarState.open ? 1 : 0"
        @click="() => {
          sidebarState.open = true
          sidebarState.index = -1
        }"
      >
        <Icon size="3xl" :fill="sidebarState.index === -1" name="user"></Icon>
      </RailItem>
    </div>
  </div>
  <div class="left-24 z-10 flex flex-row bg-surface sticky top-0 max-h-screen py-3">
    <Transition name="sidebar">
      <RailExpand v-if="sidebarState.open && sidebarState.index !== undefined" ref="sidebarexpand" :menus="sidebarState.index === -1 ? undefined : modules().value[sidebarState.index]" />
    </Transition>
  </div>
</template>

<style>
.sidebar-enter-active,
.sidebar-leave-active {
  transition: all 0.35s cubic-bezier(0.05, 0.7, 0.1, 1);
}
.sidebar-enter-from,
.sidebar-leave-to {
  width: 0px;
}
.sidebar-enter-to,
.sidebar-leave-from {
  width: 288px;
}
.sidebar-move {
  transition: all 0.35s cubic-bezier(0.05, 0.7, 0.1, 1);
}
</style>
