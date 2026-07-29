<script setup lang="ts">
/**
 * Record surface shell.
 *
 * Owns deterministic navigation, title, and route-owned controls.
 * `Detail` still owns loading, rendering, and error state, and its props are
 * forwarded unchanged.
 */
import { computed, useSlots } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import type { DetailProps, RecordIdentity } from '../../contracts'
import type { DetailCapableResource, DetailSurfaceArguments } from '../../resources/defineResource'
import Detail from '../core/Detail.vue'
import Card from '../base/Card.vue'
import NavigationHeader from './NavigationHeader.vue'

type DetailViewProps = {
  title: string
  backTo: RouteLocationRaw
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
  <section class="is-detail-view flex flex-col gap-2">
    <NavigationHeader :title="title" :back-to="backTo" back-label="Kembali">
      <template v-if="$slots.controls" #controls><slot name="controls" /></template>
    </NavigationHeader>

    <Card variant="outlined" color="surfaceContainer" class="p-0">
      <div class="p-3 sm:p-4">
      <Detail v-bind="surface.detail">
        <template v-for="([name], index) in detailSlots" #[name]="slotProps" :key="index">
          <slot :name="name" v-bind="slotProps ?? {}" />
        </template>
      </Detail>
      </div>
    </Card>
  </section>
</template>
