<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from 'vue'
import { onClickOutside } from '@vueuse/core'
import services from '@/utils/services'
import { useColorPreference } from '@/stores/colorpreference'
import { storage } from '@southneuhof/utilities/storage'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'

const profileData = storage.localStorage.get('profile') ?? {}
const root = ref<HTMLElement>()
const trigger = ref<HTMLButtonElement>()
const open = ref(false)
const signingOut = ref(false)

function close(returnFocus = false) {
  if (!open.value) return
  open.value = false
  if (returnFocus) void nextTick(() => trigger.value?.focus())
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close(true)
}

async function signOut() {
  if (signingOut.value) return
  signingOut.value = true
  try { await services.signOut() } finally { signingOut.value = false }
}

onClickOutside(root, () => close())
document.addEventListener('keydown', onKeydown)
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div ref="root" class="relative">
    <div v-if="open" role="dialog" aria-label="Account menu" class="absolute bottom-full left-0 z-50 mb-2 w-64 rounded-xl border border-outline-variant bg-surface p-3 shadow-xl">
      <div class="border-b border-outline-variant px-2 pb-3">
        <p class="font-semibold">{{ profileData.fullname || 'Account' }}</p>
        <p class="text-sm text-on-surface-variant">{{ profileData.username || '' }}</p>
      </div>
      <button type="button" class="mt-2 flex w-full items-center justify-between rounded-lg px-2 py-2 text-left hover:bg-surface-variant focus-visible:ring-2 focus-visible:ring-primary" @click="useColorPreference().toggle()">
        <span>Mode Tampilan</span>
        <Icon :name="useColorPreference().value === 'dark' ? 'sun' : 'moon'" />
      </button>
      <button type="button" class="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-error hover:bg-error-container focus-visible:ring-2 focus-visible:ring-error" :disabled="signingOut" @click="signOut">
        <Icon name="logout-box" />
        {{ signingOut ? 'Keluar…' : 'Keluar' }}
      </button>
    </div>
    <button ref="trigger" type="button" aria-haspopup="dialog" :aria-expanded="open" class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-surface-variant focus-visible:ring-2 focus-visible:ring-primary" @click="open = !open">
      <Icon name="user" />
      <span class="min-w-0 flex-1">
        <span class="block truncate text-sm font-medium">{{ profileData.fullname || 'Account' }}</span>
        <span class="block truncate text-xs text-on-surface-variant">{{ profileData.username || '' }}</span>
      </span>
      <Icon name="arrow-up-s" />
    </button>
  </div>
</template>
