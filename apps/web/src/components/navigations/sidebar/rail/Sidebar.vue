<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { activeNavigationModule, visibleNavigation } from '@/manifest'
import { allowsPermission } from '@/framework/adapters/bundle'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'
import ProfileSegment from '../../layouts/ProfileSegment.vue'

const route = useRoute()
const router = useRouter()
const navigation = computed(() => visibleNavigation(allowsPermission))
const activeModule = computed(() => activeNavigationModule(route.path, (to) => router.resolve(to as never), allowsPermission))
</script>

<template>
  <aside class="hidden min-h-0 flex-col text-on-surface lg:flex">
    <nav aria-label="Main navigation" class="flex-1 overflow-y-auto px-3 py-3">
      <section v-for="module in navigation" :key="module.name" class="mb-5">
        <h2 class="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">{{ module.title }}</h2>
        <template v-for="entry in module.routes" :key="entry.name">
          <p v-if="'separator' in entry" class="px-3 pb-1 pt-3 text-xs text-on-surface-variant">{{ entry.name }}</p>
          <RouterLink
            v-else
            :to="entry.to as never"
            class="flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors hover:bg-surface-container-high focus-visible:ring-2 focus-visible:ring-primary"
            :class="entry.name === String(route.name) || module.name === activeModule && route.path.startsWith(router.resolve(entry.to as never).path) ? 'bg-surface-container-highest text-on-surface shadow-sm ring-1 ring-outline-variant' : ''"
          >
            <Icon :name="entry.icon" />
            <span>{{ entry.title }}</span>
          </RouterLink>
        </template>
      </section>
    </nav>

    <div class="border-t border-outline-variant p-3">
      <ProfileSegment />
    </div>
  </aside>
</template>
