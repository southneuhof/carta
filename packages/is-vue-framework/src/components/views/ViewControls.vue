<script setup lang="ts">
/** Renders control descriptors as ordinary buttons and links. */
import type { ViewControl } from './controls'

defineProps<{ controls: readonly ViewControl[]; label: string }>()
</script>

<template>
  <div v-if="controls.length" class="is-view-controls" role="group" :aria-label="label">
    <template v-for="control in controls" :key="control.key">
      <a v-if="control.to" :href="control.to" :data-control="control.key" :aria-disabled="control.disabled || undefined">
        {{ control.label }}
      </a>
      <button
        v-else
        type="button"
        :data-control="control.key"
        :disabled="control.disabled || control.loading"
        @click="control.onSelect?.()"
      >
        {{ control.label }}
      </button>
    </template>
  </div>
</template>
