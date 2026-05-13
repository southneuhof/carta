<script setup lang="ts">
import Sidebar from '@/components/navigations/sidebar/rail/Sidebar.vue'
import { useScreenStore } from '@/stores/screen'
import NavigationDrawer from '@/components/navigations/sidebar/drawer/NavigationDrawer.vue'
import AppRouterView from '@/components/routing/AppRouterView.vue'
</script>

<template>
  <div class="flex flex-row w-full">
    <template v-if="useScreenStore().isAtLeast('lg')">
      <Sidebar />
    </template>
    <div
      class="z-0 flex min-h-screen w-full min-w-0 flex-col items-center gap-8 overflow-x-hidden bg-background p-8 text-on-surface"
      :style="useScreenStore().isAtLeast('lg') ? { width: 'calc(100% - 84px)' } : {}"
    >
      <NavigationDrawer v-if="!useScreenStore().isAtLeast('lg')" />
      <main class="flex w-full max-w-[1490px] flex-col gap-2">
        <AppRouterView />
      </main>
    </div>
  </div>
</template>
