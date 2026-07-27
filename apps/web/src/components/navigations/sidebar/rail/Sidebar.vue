<script setup lang="ts">
import RailItem from './layouts/RailItem.vue'
import RailExpand from './layouts/RailExpand.vue'
import { activeNavigationModule, visibleNavigation } from '@/manifest'
import Logo from '@/assets/corporate/common/Logo.vue'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { onClickOutside } from '@vueuse/core'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'
import { allowsPermission } from '@/framework/adapters/bundle'

const sidebarexpand = ref<HTMLElement>()
const sidebarState = ref<{index?: number, open: boolean}>({index: undefined, open: false})
const accessibleNavigation = computed(() => visibleNavigation(allowsPermission))
const router = useRouter()
const route = useRoute()
const activeModule = computed(() => activeNavigationModule(route.path, (to) => router.resolve(to as never), allowsPermission))

function selectModule(index: number) {
  const item = accessibleNavigation.value[index]
  sidebarState.value.index = index
  if (item.routes.length === 1 && !('separator' in item.routes[0])) {
    sidebarState.value.open = false
    return router.push({ name: item.routes[0].name } as never)
  }
  sidebarState.value.open = true
}

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
          v-for="(item, index) in accessibleNavigation"
          :key="item.name"
          :title="item.title"
          :state="item.name === activeModule ? 2 : sidebarState.index === index ? 1 : 0"
          @click="selectModule(index)"
        >
          <Icon size="3xl" :fill="item.name === activeModule" :name="item.icon"></Icon>
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
      <RailExpand v-if="sidebarState.open && sidebarState.index !== undefined" ref="sidebarexpand" :menus="sidebarState.index === -1 ? undefined : accessibleNavigation[sidebarState.index]" />
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
