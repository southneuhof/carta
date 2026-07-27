<script setup lang="ts">
/**
 * Record surface shell.
 *
 * Owns the Card, title, back/edit/delete control placement, and print region.
 * `Detail` still owns loading, rendering, and error state, and its props are
 * forwarded unchanged.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import type { DetailProps, RecordIdentity } from '../../contracts'
import type { DetailCapableResource, DetailSurfaceArguments, ResourceAction } from '../../resources/defineResource'
import { useResourceRuntime } from '../../resources/runtime'
import Detail from '../core/Detail.vue'
import ViewControls from './ViewControls.vue'
import { controlsAt, type ViewControl } from './controls'

type DetailViewProps = {
  title?: string
  description?: string
} & (
  | {
      resource: DetailCapableResource<Record<string, unknown>, RecordIdentity> & {
        actions: Partial<Record<'list' | 'delete', ResourceAction<RecordIdentity>>>
        remove?: (id: RecordIdentity) => Promise<unknown>
      }
      id: RecordIdentity
      detail?: never
      controls?: never
      detailOptions?: Omit<DetailSurfaceArguments, 'id' | 'onDelete'>
    }
  | { detail: DetailProps; controls?: readonly ViewControl[]; resource?: never; id?: never; detailOptions?: never }
)

const props = defineProps<DetailViewProps>()
const router = useRouter()
const deletePending = ref(false)
let mounted = true
onBeforeUnmount(() => {
  mounted = false
})

async function remove() {
  if (!props.resource || props.id === undefined || deletePending.value) return
  deletePending.value = true
  try {
    if (!props.resource.remove) return
    await props.resource.remove(props.id)
    toast.success('Data berhasil dihapus.')
    const list = props.resource.actions.list?.to
    if (list && typeof list !== 'function') await router.replace(list)
  } catch (error) {
    toast.error(useResourceRuntime().adapters.data.normalizeError(error).message || 'Gagal menghapus data.')
  } finally {
    if (mounted) deletePending.value = false
  }
}

const surface = computed(() => {
  if (!props.resource) return { detail: props.detail!, controls: props.controls ?? [] }
  return props.resource.detail({
    ...props.detailOptions,
    id: props.id,
    onDelete: remove,
    controls: {
      ...props.detailOptions?.controls,
      overrides: {
        ...props.detailOptions?.controls?.overrides,
        delete: deletePending.value ? { disabled: true, loading: true } : props.detailOptions?.controls?.overrides?.delete,
      },
    },
  })
})
</script>

<template>
  <section class="is-detail-view">
    <header>
      <slot name="header">
        <h1 v-if="title">{{ title }}</h1>
        <p v-if="description">{{ description }}</p>
      </slot>
      <slot name="controls">
        <ViewControls :controls="controlsAt(surface.controls, 'primary')" label="Kontrol utama" />
      </slot>
    </header>

    <slot name="body" v-bind="{ detail: surface.detail }">
      <Detail v-bind="surface.detail">
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
        <ViewControls :controls="controlsAt(surface.controls, 'secondary')" label="Kontrol tambahan" />
      </slot>
    </footer>
  </section>
</template>
