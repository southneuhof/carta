<script setup lang="ts">
/**
 * Record surface shell.
 *
 * Owns the Card, title, back/edit/delete control placement, and print region.
 * `Detail` still owns loading, rendering, and error state, and its props are
 * forwarded unchanged.
 */
import type { DetailProps } from '../../contracts'
import Detail from '../core/Detail.vue'
import ViewControls from './ViewControls.vue'
import { controlsAt, type ViewControl } from './controls'

const props = defineProps<{
  detail: DetailProps
  title?: string
  description?: string
  controls?: readonly ViewControl[]
}>()
</script>

<template>
  <section class="is-detail-view">
    <header>
      <slot name="header">
        <h1 v-if="title">{{ title }}</h1>
        <p v-if="description">{{ description }}</p>
      </slot>
      <slot name="controls">
        <ViewControls :controls="controlsAt(props.controls, 'primary')" label="Kontrol utama" />
      </slot>
    </header>

    <slot name="body" v-bind="{ detail: props.detail }">
      <Detail v-bind="props.detail">
        <template v-for="(_, name) in $slots" #[name]="slotProps" :key="name">
          <slot :name="name" v-bind="slotProps ?? {}" />
        </template>
      </Detail>
    </slot>

    <div class="is-detail-view-print">
      <slot name="print" />
    </div>

    <footer>
      <slot name="footer">
        <ViewControls :controls="controlsAt(props.controls, 'secondary')" label="Kontrol tambahan" />
      </slot>
    </footer>
  </section>
</template>
