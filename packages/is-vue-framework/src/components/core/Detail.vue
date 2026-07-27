<script setup lang="ts">
/**
 * Record core.
 *
 * Owns record loading, field rendering, and loading/empty/error states. It owns
 * no page layout, route navigation, or edit and delete controls.
 */
import { computed } from 'vue'
import type { DetailProps, RecordLoadContext, RecordResult } from '../../contracts'
import { resolveFields } from '../../fields'
import { useLoader } from '../../query'
import { useRendererRegistry } from '../../renderers/registry'
import { assertSingleDataSource, ownerOf, recordCacheKey } from './useCoreData'

const props = withDefaults(defineProps<DetailProps>(), {
  searchParameters: () => ({}),
})

assertSingleDataSource('Detail', props.data, props.load)

const renderers = useRendererRegistry('detail')

const fields = computed(() => resolveFields({ fields: props.fields, surface: 'detail' }))
const owner = ownerOf(props.namespace, 'detail')

const loaded = useLoader<RecordLoadContext, RecordResult>({
  key: computed(() => recordCacheKey(owner, props.id, props.searchParameters ?? {})),
  context: computed(() => ({ id: props.id, searchParameters: props.searchParameters ?? {} })),
  load: computed(() => props.load),
  data: computed(() => props.data),
})

const record = computed(() => loaded.data.value)
const entries = computed(() =>
  fields.value.map((field) => ({
    field,
    value: record.value ? (field.read ? field.read(record.value, {}) : record.value[field.key]) : undefined,
  })),
)

defineExpose({ refresh: loaded.refresh })
</script>

<template>
  <div class="is-detail">
    <slot v-if="loaded.loading.value" name="loading">
      <p role="status" aria-live="polite">Memuat…</p>
    </slot>

    <slot v-else-if="loaded.error.value" name="error" :error="loaded.error.value">
      <p role="alert">{{ loaded.error.value?.message }}</p>
    </slot>

    <slot v-else-if="!record" name="empty">
      <p>Data tidak ditemukan.</p>
    </slot>

    <dl v-else>
      <template v-for="entry in entries" :key="entry.field.key">
        <dt>{{ entry.field.label }}</dt>
        <dd :data-emphasis="entry.field.emphasis">
          <slot :name="`value:${entry.field.key}`" :value="entry.value" :record="record" :field="entry.field">
            <component
              :is="renderers.require(entry.field.renderer)"
              v-if="entry.field.renderer"
              v-bind="entry.field.props"
              :value="entry.value"
              :record="record"
              :field="entry.field"
            />
            <template v-else>{{ entry.value ?? '-' }}</template>
          </slot>
        </dd>
      </template>
    </dl>
  </div>
</template>
