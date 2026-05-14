<script setup lang="ts">
import services from '@/utils/services'
import { useColorPreference } from '@/stores/colorpreference'
import { storage } from '@southneuhof/is-vue-framework/utils/storage'
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'

const profileData = storage.localStorage.get('profile')
</script>

<template>
  <div class="flex h-full flex-col justify-between">
    <div class="flex flex-col gap-8">
      <div class="flex flex-col gap-2">
        <div class="flex flex-row items-center justify-between gap-4">
          <div>
            <p class="text-lg font-semibold">{{ profileData.fullname }}</p>
            <p class="text-sm text-muted">{{ profileData.username }}</p>
          </div>
        </div>
      </div>
      <div class="flex flex-col gap-4">
        <div class="flex w-full flex-row items-center justify-between">
          <div>Mode Tampilan</div>
          <Button kind="icon" variant="text" size="square" @click="useColorPreference().toggle()">
            <template #icon>
              <Icon :name="useColorPreference().value == 'dark' ? 'sun' : 'moon'" />
            </template>
          </Button>
        </div>
        <div class="flex flex-row items-center gap-2">
          <Button @click="services.signOut()" class="w-full" variant="tonal" color="error">
            <template #icon>
              <Icon name="logout-box" />
            </template>
            Keluar
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
