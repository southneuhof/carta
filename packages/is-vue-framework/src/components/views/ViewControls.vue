<script setup lang="ts">
/** Renders control descriptors as ordinary buttons and links. */
import type { ViewControl } from './controls'

defineProps<{ controls: readonly ViewControl[]; label: string }>()
</script>

<template>
  <div v-if="controls.length" class="is-view-controls" role="group" :aria-label="label">
    <template v-for="control in controls" :key="control.key">
      <RouterLink v-if="control.to" v-slot="{ href, navigate }" custom :to="control.to">
        <a
          :href="href"
          :data-control="control.key"
          :aria-disabled="control.disabled || control.loading || undefined"
          @click="(event) => !(control.disabled || control.loading) && navigate(event)"
        >
          {{ control.label }}
        </a>
      </RouterLink>
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
