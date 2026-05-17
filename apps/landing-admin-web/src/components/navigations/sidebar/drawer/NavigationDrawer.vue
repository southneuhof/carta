<script setup lang="ts">
import ProfileSegment from '../../layouts/ProfileSegment.vue'
import { modules } from '@/stores/modules'
import NavItem from './layouts/NavItem.vue'
import { ref } from 'vue'
import { onClickOutside } from '@vueuse/core'
import Logo from '@/assets/corporate/common/Logo.vue'
import { useRouter } from 'vue-router'
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'

const sidebarexpand = ref<HTMLElement | null>(null)
const sidebarState = ref<{ index: number; open: boolean }>({ index: 0, open: false })
const sidebarView = ref<'modules' | 'routes' | 'profile'>('modules')
const router = useRouter()

const closeSidebar = () => {
  sidebarState.value.open = false
  sidebarView.value = 'modules'
}

const openSidebar = () => {
  sidebarState.value.open = true
}

const nonSeparatorRoutes = (module: any) => module.routes.filter((route: any) => !route.separator)

const selectModule = (module: any, index: number) => {
  sidebarState.value.index = index
  const routes = nonSeparatorRoutes(module)
  if (routes.length <= 1) {
    if (routes[0]?.name) {
      router.push({ name: routes[0].name })
    }
    closeSidebar()
    return
  }
  sidebarView.value = 'routes'
}

const selectRoute = (routeName: string) => {
  router.push({ name: routeName })
  closeSidebar()
}

onClickOutside(sidebarexpand, closeSidebar, { ignore: ['#sidebar', '#dialog', 'input', '#file', 'input#file'] })
</script>

<template>
  <div class="sticky top-0 z-40 flex w-full flex-row justify-between bg-surface py-4">
    <button aria-label="Open menu" @click="openSidebar"><Icon name="menu" /></button>
    <Logo class="!max-w-12"></Logo>
  </div>
  <div
    ref="sidebarexpand"
    id="sidebar"
    class="duration-[350ms] fixed top-0 z-50 flex max-h-screen min-h-screen min-w-[288px] max-w-[288px] flex-col gap-8 rounded-r-2xl border-x border-surface-variant/[25%] bg-surface-container p-8 text-on-surface transition-all"
    :class="sidebarState.open ? 'left-0' : '-left-[288px]'"
  >
    <Button kind="icon" variant="standard" class="ml-2 w-fit" @click="closeSidebar"><Icon name="close" /></Button>
    <TransitionGroup mode="out-in" tag="div" name="viewmode" class="min-w-full overflow-scroll">
      <div v-if="sidebarView === 'modules'" class="flex flex-col gap-2">
        <NavItem :key="item.name" v-for="(item, index) in modules().value" :route="item" :active="item.name === String($route.meta.moduleName)" @click="selectModule(item, index)" />
        <NavItem :active="sidebarState.index === -1" :route="{ icon: 'user', title: 'Profil' }" @click="() => (sidebarView = 'profile')" />
      </div>
      <div v-else-if="sidebarView === 'routes'" class="flex flex-col gap-2">
        <NavItem :active="false" :route="{ icon: 'arrow-left', title: 'Kembali' }" @click="sidebarView = 'modules'"></NavItem>
        <div v-for="route in modules().value[sidebarState.index]?.routes ?? []" :key="route.name">
          <div v-if="route.separator" class="px-4 py-2 text-sm text-muted">{{ route.name }}</div>
          <NavItem v-else :active="route.name === String($route.name)" :route="route" @click="() => selectRoute(route.name)" />
        </div>
      </div>
      <div v-else-if="sidebarView === 'profile'" class="flex flex-col gap-2">
        <NavItem :active="false" :route="{ icon: 'arrow-left', title: 'Kembali' }" @click="() => (sidebarView = 'modules')"></NavItem>
        <ProfileSegment />
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.viewmode-enter-active,
.viewmode-leave-active {
  transition: all 0.1725s ease;
  position: absolute;
}

.viewmode-leave-to {
  opacity: 0;
  transform: v-bind('sidebarView === "modules" ? "translateX(-5%)" : "translateX(5%)"');
  min-width: 230px;
  position: absolute;
}
.viewmode-enter-from {
  opacity: 0;
  transform: v-bind('sidebarView === "modules" ? "translateX(5%)" : "translateX(-5%)"');
  min-width: 230px;
  position: absolute;
}

.viewmode-enter-to,
.viewmode-leave-from {
  opacity: 1;
  transform: translateX(0%);
  min-width: 230px;
  transition-delay: 0.1725s;
  position: absolute;
}
.viewmode-move {
  transition: all 0.17s ease;
  position: absolute;
}
</style>
