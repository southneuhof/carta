<script setup lang="ts">
/**
 * Collection surface shell.
 *
 * Owns the Card, page title, toolbar, filter region, and standard control
 * placement; `Table` still owns every piece of data state. The `table` prop is
 * forwarded with `v-bind` and never translated, so a resource prop factory
 * result binds directly.
 */
import { computed } from 'vue'
import type { RecordIdentity, TableProps } from '../../contracts'
import type { Resource, TableSurfaceArguments } from '../../resources/defineResource'
import Table from '../core/Table.vue'
import ViewControls from './ViewControls.vue'
import { controlsAt, type ViewControl } from './controls'

type ListViewProps = {
  title?: string
  description?: string
} & (
  | {
      resource: Resource<Record<string, unknown>, Record<string, unknown>, Record<string, unknown>, Record<string, unknown>, RecordIdentity>
      table?: never
      controls?: never
      tableOptions?: TableSurfaceArguments
    }
  | { table: TableProps; controls?: readonly ViewControl[]; resource?: never; tableOptions?: never }
)

const props = defineProps<ListViewProps>()

const surface = computed(() =>
  props.resource
    ? props.resource.table(props.tableOptions)
    : { table: props.table!, controls: props.controls ?? [] },
)
</script>

<template>
  <section class="is-list-view">
    <header>
      <slot name="header">
        <h1 v-if="title">{{ title }}</h1>
        <p v-if="description">{{ description }}</p>
      </slot>
      <slot name="controls">
        <ViewControls :controls="controlsAt(surface.controls, 'primary')" label="Kontrol utama" />
      </slot>
    </header>

    <slot name="filters" />

    <slot name="body" v-bind="{ table: surface.table }">
      <Table v-bind="surface.table">
        <template v-for="(_, name) in $slots" #[name]="slotProps" :key="name">
          <slot :name="name" v-bind="slotProps ?? {}" />
        </template>
      </Table>
    </slot>

    <footer>
      <slot name="footer">
        <ViewControls :controls="controlsAt(surface.controls, 'secondary')" label="Kontrol tambahan" />
      </slot>
    </footer>
  </section>
</template>
