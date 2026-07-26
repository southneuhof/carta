<script setup lang="ts">
/**
 * Collection surface shell.
 *
 * Owns the Card, page title, toolbar, filter region, and standard control
 * placement; `Table` still owns every piece of data state. The `table` prop is
 * forwarded with `v-bind` and never translated, so a resource prop factory
 * result binds directly.
 */
import type { TableProps } from '../../contracts'
import Table from '../core/Table.vue'
import ViewControls from './ViewControls.vue'
import { controlsAt, type ViewControl } from './controls'

const props = defineProps<{
  table: TableProps
  title?: string
  description?: string
  controls?: readonly ViewControl[]
}>()
</script>

<template>
  <section class="is-list-view">
    <header>
      <slot name="header">
        <h1 v-if="title">{{ title }}</h1>
        <p v-if="description">{{ description }}</p>
      </slot>
      <slot name="controls">
        <ViewControls :controls="controlsAt(props.controls, 'primary')" label="Kontrol utama" />
      </slot>
    </header>

    <slot name="filters" />

    <slot name="body" v-bind="{ table: props.table }">
      <Table v-bind="props.table">
        <template v-for="(_, name) in $slots" #[name]="slotProps" :key="name">
          <slot :name="name" v-bind="slotProps ?? {}" />
        </template>
      </Table>
    </slot>

    <footer>
      <slot name="footer">
        <ViewControls :controls="controlsAt(props.controls, 'secondary')" label="Kontrol tambahan" />
      </slot>
    </footer>
  </section>
</template>
