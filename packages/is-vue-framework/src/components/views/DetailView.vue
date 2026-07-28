<script setup lang="ts">
/**
 * Record surface shell.
 *
 * Owns deterministic navigation, title, and route-owned controls.
 * `Detail` still owns loading, rendering, and error state, and its props are
 * forwarded unchanged.
 */
import { computed, useSlots } from 'vue'
import { RouterLink } from 'vue-router'
import type { RouteLocationRaw } from 'vue-router'
import type { DetailProps, RecordIdentity } from '../../contracts'
import type { DetailCapableResource, DetailSurfaceArguments } from '../../resources/defineResource'
import Detail from '../core/Detail.vue'
import Button from '../base/Button.vue'
import Card from '../base/Card.vue'
import Icon from '../base/Icon.vue'

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
    <Card variant="outlined" color="surfaceContainer" class="gap-0 p-0">
      <header class="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex min-w-0 items-center gap-3">
          <RouterLink v-slot="{ href, navigate }" custom :to="backTo">
            <Button kind="icon" variant="standard" :href="href" aria-label="Kembali" @click="navigate">
              <template #icon><Icon name="arrow-left" /></template>
            </Button>
          </RouterLink>
          <h1 class="min-w-0 text-lg font-semibold tracking-tight text-on-surface">{{ title }}</h1>
        </div>
        <div v-if="$slots.controls" class="flex flex-wrap items-center gap-2">
          <slot name="controls" />
        </div>
      </header>
    </Card>

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
