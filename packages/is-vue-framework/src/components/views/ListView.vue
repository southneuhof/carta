<script setup lang="ts">
/**
 * Collection surface shell.
 *
 * Owns Card, page title, toolbar, and filter region; `Table` still owns every
 * piece of data state. `table` prop is
 * forwarded with `v-bind` and never translated, so a resource prop factory
 * result binds directly.
 */
import { computed, ref, useSlots } from 'vue'
import type { RecordIdentity, TableProps } from '../../contracts'
import type { ListCapableResource, RowAction, TableSurfaceArguments } from '../../resources/defineResource'
import Table from '../core/Table.vue'
import Button from '../base/Button.vue'
import Card from '../base/Card.vue'
import Dialog from '../base/Dialog.vue'
import Icon from '../base/Icon.vue'
import SearchBox from '../composites/SearchBox.vue'

type ListViewProps = {
  title?: string
  description?: string
} & (
  | {
      resource: ListCapableResource<Record<string, unknown>, Record<string, unknown>>
      table?: never
      tableOptions?: TableSurfaceArguments
    }
  | { table: TableProps; resource?: never; tableOptions?: never }
)

const props = defineProps<ListViewProps>()
const slots = useSlots()

type ListViewSurface = {
  table: TableProps
  rowControls: ((record: Record<string, unknown>) => RowAction[]) | undefined
}

const surface = computed<ListViewSurface>(() =>
  props.resource
    ? props.resource.table(props.tableOptions)
    : { table: props.table!, rowControls: undefined },
)
const passthroughSlots = computed(() => Object.entries(slots).filter(([name]) => !['header', 'controls', 'filters', 'body', 'footer', 'row-actions'].includes(name)))

const deleting = ref(false)

function iconFor(control: RowAction) {
  if (control.key === 'detail') return 'eye'
  if (control.key === 'update') return 'edit'
  return 'delete-bin'
}

function isNavigationAction(action: RowAction): action is Extract<RowAction, { to: unknown }> {
  return 'to' in action
}

async function remove(control: Extract<RowAction, { onSelect: unknown }>, close: (value: boolean) => void) {
  if (deleting.value) return
  deleting.value = true
  try {
    await control.onSelect()
    close(false)
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <section class="is-list-view">
    <Card variant="outlined" color="surfaceContainerLow" class="gap-0 p-0">
      <header class="flex flex-col gap-4 border-b border-outline/[16%] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <slot name="header">
          <div class="min-w-0">
            <h1 v-if="title" class="text-lg font-semibold tracking-tight text-on-surface">{{ title }}</h1>
            <p v-if="description" class="mt-1 text-sm text-on-surface-variant">{{ description }}</p>
          </div>
        </slot>
        <SearchBox/>
        <slot name="controls" />
      </header>

      <div v-if="$slots.filters" class="border-b border-outline/[16%] px-5 py-3">
        <slot name="filters" />
      </div>

      <slot name="body" v-bind="{ table: surface.table }">
        <div class="p-3 sm:p-4">
          <Table v-bind="surface.table">
            <template v-if="$slots['row-actions'] || surface.rowControls" #row-actions="slotProps">
              <slot v-if="$slots['row-actions']" name="row-actions" v-bind="slotProps" />
              <div v-else-if="surface.rowControls" class="flex items-center justify-end gap-1" aria-label="Aksi baris">
                <template v-for="control in surface.rowControls(slotProps.record)" :key="control.key">
                  <RouterLink v-if="isNavigationAction(control)" v-slot="{ href, navigate }" custom :to="control.to">
                    <Button kind="icon" variant="standard" :href="href" :aria-label="control.label" @click.stop="navigate">
                      <template #icon><Icon :name="iconFor(control)" size="base" /></template>
                    </Button>
                  </RouterLink>
                  <Dialog v-else>
                    <template #trigger>
                      <Button kind="icon" variant="standard" color="error" :aria-label="control.label" @click.stop>
                        <template #icon><Icon name="delete-bin" size="base" /></template>
                      </Button>
                    </template>
                    <template #title>Hapus data?</template>
                    <template #description>Tindakan ini tidak dapat dibatalkan.</template>
                    <template #footer="{ setOpen }">
                      <div class="flex w-full justify-end gap-2">
                        <Button type="button" variant="text" :disabled="deleting" @click="setOpen(false)">Batal</Button>
                        <Button type="button" color="error" :disabled="deleting" @click="remove(control, setOpen)">Hapus</Button>
                      </div>
                    </template>
                  </Dialog>
                </template>
              </div>
            </template>
            <template v-for="([name], index) in passthroughSlots" #[name]="slotProps" :key="index">
              <slot :name="name" v-bind="slotProps ?? {}" />
            </template>
          </Table>
        </div>
      </slot>

      <footer v-if="$slots.footer" class="border-t border-outline/[16%] px-5 py-3">
        <slot name="footer" />
      </footer>
    </Card>
  </section>
</template>
