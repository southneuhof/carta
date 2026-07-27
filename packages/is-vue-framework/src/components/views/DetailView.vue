<script setup lang="ts">
/**
 * Record surface shell.
 *
 * Owns title and print region.
 * `Detail` still owns loading, rendering, and error state, and its props are
 * forwarded unchanged.
 */
import { computed, useSlots } from 'vue'
import type { DetailProps, RecordIdentity } from '../../contracts'
import type { DetailCapableResource, DetailSurfaceArguments } from '../../resources/defineResource'
import Detail from '../core/Detail.vue'

type DetailViewProps = {
  title?: string
  description?: string
} & (
  | {
      resource: DetailCapableResource<Record<string, unknown>, RecordIdentity>
      id: RecordIdentity
      detail?: never
      detailOptions?: Omit<DetailSurfaceArguments, 'id'>
    }
  | { detail: DetailProps; resource?: never; id?: never; detailOptions?: never }
)

const props = defineProps<DetailViewProps>()
const detailSlots = computed(() => Object.entries(useSlots()).filter(([name]) => name.startsWith('value:')))

const surface = computed(() => {
  if (!props.resource) return { detail: props.detail! }
  return props.resource.detail({ ...props.detailOptions, id: props.id })
})
</script>

<template>
  <section class="is-detail-view">
    <header>
      <slot name="header">
        <h1 v-if="title">{{ title }}</h1>
        <p v-if="description">{{ description }}</p>
      </slot>
      <slot name="controls" />
    </header>

    <slot name="body" v-bind="{ detail: surface.detail }">
      <Detail v-bind="surface.detail">
        <template v-for="([name], index) in detailSlots" #[name]="slotProps" :key="index">
          <slot :name="name" v-bind="slotProps ?? {}" />
        </template>
      </Detail>
    </slot>

    <div class="is-detail-view-print">
      <slot name="print" />
    </div>

    <footer>
      <slot name="footer" />
    </footer>
  </section>
</template>
