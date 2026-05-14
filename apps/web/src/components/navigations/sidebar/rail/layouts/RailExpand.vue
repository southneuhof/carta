<script setup lang="ts">
import { titleCase } from '@southneuhof/is-vue-framework/utils/string'
import ProfileSegment from '../../../layouts/ProfileSegment.vue'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'

const props = defineProps({
  menus: {
    type: Object,
    required: false,
  },
})
</script>

<template>
  <div class="z-10 overflow-hidden rounded-r-2xl bg-surface-container text-on-surface -ml-2">
    <div class="sticky top-0 -z-10 flex h-screen min-w-[288px] max-w-[288px] flex-col justify-between gap-8 overflow-auto rounded-r-2xl p-8">
      <ProfileSegment v-if="!menus"/>
      <div v-else class="rounded-xl">
        <div class="flex flex-col gap-8">
          <div class="text-2xl font-bold">{{ menus.title }}</div>
          <hr/>
          <div class="flex flex-col gap-2">
            <div v-for="submenu in menus.routes">
              <div v-if="submenu.separator" class="text-muted px-4 py-2 text-sm">{{ submenu.name }}</div>
              <button v-else-if="String($route.name) === submenu.name" class="overlay flex w-full flex-row items-center gap-4 rounded-full bg-primary p-4 text-on-primary after:hover:bg-on-primary/[8%] after:active:bg-on-primary/[12%]    ">
                <Icon :FILL="1" :name="submenu.icon"></Icon>
                <div class="text-left">{{ titleCase(submenu.title) }}</div>
              </button>
              <button v-else @click="() => $router.push({name: submenu.name})" class="overlay flex w-full flex-row items-center gap-4 rounded-full p-4 text-on-surface after:hover:bg-on-surface/[8%] after:active:bg-on-surface/[12%]   ">
                <Icon :name="submenu.icon"></Icon>
                <div class="text-left">{{ titleCase(submenu.title) }}</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
