<script setup lang="ts">
import { nextTick, ref } from 'vue'
import Sidebar from '@/components/navigations/sidebar/rail/Sidebar.vue'
import NavigationDrawer from '@/components/navigations/sidebar/drawer/NavigationDrawer.vue'
import AppRouterView from '@/components/routing/AppRouterView.vue'
import GlobalToolbar from '@/components/navigations/GlobalToolbar.vue'
import Logo from '@/assets/corporate/common/Logo.vue'

const mobileNavigationOpen = ref(false)
function closeMobileNavigation() {
  mobileNavigationOpen.value = false
  void nextTick(() => document.querySelector<HTMLButtonElement>('[data-mobile-menu-trigger]')?.focus())
}
</script>

<template>
  <div
    class="grid min-h-screen w-full grid-cols-1 grid-rows-[auto_1fr] bg-background text-on-surface lg:h-screen lg:grid-cols-[18rem_minmax(0,1fr)] lg:grid-rows-[var(--app-toolbar-height)_minmax(0,1fr)]"
    style="--app-toolbar-height: 3.5rem"
  >
    <div class="hidden h-full items-center gap-2 overflow-hidden bg-surface-container px-4 lg:flex">
      <Logo class="size-8 shrink-0" />
      <span class="truncate text-sm font-semibold">Information System</span>
    </div>
    <GlobalToolbar @open-navigation="mobileNavigationOpen = true" />
    <Sidebar />
    <NavigationDrawer :open="mobileNavigationOpen" @close="closeMobileNavigation" />
    <div class="z-0 flex min-h-0 min-w-0 flex-col overflow-x-hidden overflow-y-auto">
      <main class="mx-auto flex w-full max-w-[1490px] flex-1 flex-col gap-2 p-4 sm:p-6 lg:p-8"><AppRouterView /></main>
    </div>
  </div>
</template>
