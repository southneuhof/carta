<script setup lang="ts">
import { ref } from 'vue'
import services from '@/utils/services'
import { useColorPreference } from '@/stores/colorpreference'
import { storage } from '@southneuhof/utilities/storage'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'
import Popover from '@southneuhof/is-vue-framework/components/base/Popover.vue'

const profileData = storage.localStorage.get('profile') ?? {}
const open = ref(false)
const signingOut = ref(false)

async function signOut() {
  if (signingOut.value) return
  signingOut.value = true
  try { await services.signOut() } finally { signingOut.value = false }
}

</script>

<template>
  <Popover
    v-model="open"
    side="top"
    :side-offset="8"
    content-class="w-64 rounded-xl p-3 shadow-xl"
  >
    <template #trigger>
      <button type="button" class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-surface-variant focus-visible:ring-2 focus-visible:ring-primary">
        <Icon name="user" />
        <span class="min-w-0 flex-1">
          <span class="block truncate text-sm font-medium">{{ profileData.fullname || 'Account' }}</span>
          <span class="block truncate text-xs text-on-surface">{{ profileData.username || '' }}</span>
        </span>
        <Icon name="arrow-up-s" />
      </button>
    </template>
    <template #content>
      <div class="border-b border-outline-variant px-2 pb-3">
        <p class="font-semibold">{{ profileData.fullname || 'Account' }}</p>
        <p class="text-sm text-on-surface">{{ profileData.username || '' }}</p>
      </div>
      <button type="button" class="mt-2 flex w-full items-center justify-between rounded-lg px-2 py-2 text-left hover:bg-surface-variant focus-visible:ring-2 focus-visible:ring-primary" @click="useColorPreference().toggle()">
        <span>Mode Tampilan</span>
        <Icon :name="useColorPreference().value === 'dark' ? 'sun' : 'moon'" />
      </button>
      <button type="button" class="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-error hover:bg-error-container focus-visible:ring-2 focus-visible:ring-error" :disabled="signingOut" @click="signOut">
        <Icon name="logout-box" />
        {{ signingOut ? 'Keluar…' : 'Keluar' }}
      </button>
    </template>
  </Popover>
</template>
