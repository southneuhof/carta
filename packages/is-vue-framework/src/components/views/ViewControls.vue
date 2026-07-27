<script setup lang="ts">
/** Renders control descriptors as ordinary buttons and links. */
import type { ViewControl } from './controls'
import Button from '../base/Button.vue'

defineProps<{ controls: readonly ViewControl[]; label: string }>()
</script>

<template>
  <div v-if="controls.length" class="is-view-controls flex flex-wrap items-center gap-2" role="group" :aria-label="label">
    <template v-for="control in controls" :key="control.key">
      <RouterLink v-if="control.to" v-slot="{ href, navigate }" custom :to="control.to">
        <Button
          type="button"
          variant="outlined"
          :href="href"
          :data-control="control.key"
          :disabled="control.disabled || control.loading"
          @click="navigate"
        >
          {{ control.label }}
        </Button>
      </RouterLink>
      <Button
        v-else
        type="button"
        variant="outlined"
        :data-control="control.key"
        :disabled="control.disabled || control.loading"
        @click="control.onSelect?.()"
      >
        {{ control.label }}
      </Button>
    </template>
  </div>
</template>
