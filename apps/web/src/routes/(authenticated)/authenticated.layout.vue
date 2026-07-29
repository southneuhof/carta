<script setup lang="ts">
import Sidebar from '@/components/navigations/sidebar/rail/Sidebar.vue'
import NavigationDrawer from '@/components/navigations/sidebar/drawer/NavigationDrawer.vue'
import AppRouterView from '@/components/routing/AppRouterView.vue'
import NotificationInbox from '@/components/navigations/NotificationInbox.vue'
</script>

<template>
  <div class="flex min-h-screen w-full bg-background text-on-surface">
    <Sidebar />
    <div class="z-0 flex min-h-screen min-w-0 flex-1 flex-col overflow-x-hidden">
      <NavigationDrawer />
      <!-- Mounted once, here: the inbox owns the only polling timer in the app. -->
      <NotificationInbox />
      <main class="mx-auto flex w-full max-w-[1490px] flex-1 flex-col gap-2 p-4 sm:p-6 lg:p-8"><AppRouterView /></main>
    </div>
  </div>
</template>
