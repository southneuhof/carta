<script setup lang="ts">
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import type { Component } from 'vue'

type MenuItem = {
  name: string
  icon?: Component
  action: () => void
}

const props = defineProps({
  items: {
    type: Array<MenuItem>,
    required: true,
  },
})
</script>

<template>
  <Menu as="div" class="relative inline-block text-left">
    <div>
      <MenuButton>
        <slot name="trigger"></slot>
      </MenuButton>
    </div>

    <transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <MenuItems class="absolute -top-2 right-0 w-56 origin-top-right -translate-y-full translate-x-[80%] transform divide-y divide-gray-100 rounded-md bg-white shadow-lg focus:outline-none">
        <div class="px-1 py-1">
          <MenuItem v-for="item in items" v-slot="{ active }" @click="item.action">
            <button :class="[active ? 'bg-violet-500 text-white' : 'text-gray-900', 'group flex w-full items-center rounded-md px-2 py-2 text-sm']">
              <component v-if="item.icon" :is="item.icon" class="mr-2 h-5 w-5 text-violet-400"></component>
              {{ item.name }}
            </button>
          </MenuItem>
        </div>
      </MenuItems>
    </transition>
  </Menu>
</template>
