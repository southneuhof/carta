<script setup lang="ts">
/**
 * Draft core.
 *
 * Owns mutable draft state, field rendering, validation, optional initial-data
 * loading, and submission. It does not know whether the behavior it was given
 * creates, updates, or runs another workflow: there is no mode. The factory
 * that wired `submit` also wired the matching schema (plan 006).
 *
 * Field behavior is applied here as reactive wiring only: each declared
 * function is one computed over the draft, hidden fields contribute no value to
 * the submitted draft, and validation runs on the visibility-filtered draft.
 */
import { computed, reactive, ref, watch } from 'vue'
import type { FormProps, RecordLoadContext, SubmitError, ValidationIssue } from '../../contracts'
import { createBehaviorRuntime, resolveFields } from '../../fields'
import { validateDraft } from '../../validation'
import { useLoader } from '../../query'
import { useFrameworkAdapters } from '../../adapters/projectAdapters'
import { useRendererRegistry } from '../../renderers/registry'
import { assertSingleDataSource, ownerOf, recordCacheKey } from './useCoreData'

const props = withDefaults(defineProps<FormProps>(), {
  searchParameters: () => ({}),
  disabled: false,
})

const emit = defineEmits<{
  (event: 'submitted', result: unknown): void
  (event: 'error', error: SubmitError): void
  (event: 'reset'): void
}>()

const adapters = useFrameworkAdapters()
const renderers = useRendererRegistry('form')

const fields = computed(() => resolveFields({ fields: props.fields, surface: 'form' }))
const owner = ownerOf(props.namespace, 'form')

const loaded = useLoader<RecordLoadContext, Partial<Record<string, unknown>> | undefined>({
  key: computed(() => recordCacheKey(owner, undefined, props.searchParameters ?? {})),
  context: computed(() => ({ searchParameters: props.searchParameters ?? {} })),
  load: computed(() => props.load),
})

const draft = reactive<Record<string, unknown>>({ ...(props.initialData ?? {}) })
const edited = reactive(new Set<string>())
const touched = reactive<Record<string, boolean>>({})
const issues = ref<ValidationIssue[]>([])
const submitError = ref<SubmitError>()
const submitting = ref(false)

/** Loaded values override initial values; user edits override both. */
watch(
  () => loaded.data.value,
  (value) => {
    if (!value) return
    for (const [key, next] of Object.entries(value)) {
      if (edited.has(key)) continue
      draft[key] = next
    }
  },
  { immediate: true },
)

const behavior = createBehaviorRuntime({ fields: fields.value, draft })
behavior.connect((key, value) => {
  draft[key] = value
  edited.delete(key)
})

const hiddenKeys = computed(() => fields.value.map((field) => field.key).filter((key) => !behavior.visibleKeys.value.includes(key)))
const visibleFields = computed(() => fields.value.filter((field) => behavior.state(field.key).value.visible))
const dirty = computed(() => edited.size > 0)

function issueFor(key: string) {
  return issues.value.find((issue) => issue.path[0] === key)?.message
}

function setValue(key: string, value: unknown) {
  const field = fields.value.find((entry) => entry.key === key)
  edited.add(key)
  touched[key] = true
  if (field?.write) field.write(draft, value, {})
  else draft[key] = value
}

function reset() {
  for (const key of Object.keys(draft)) delete draft[key]
  Object.assign(draft, props.initialData ?? {}, loaded.data.value ?? {})
  edited.clear()
  issues.value = []
  submitError.value = undefined
  emit('reset')
}

async function submit() {
  if (props.disabled || submitting.value) return
  issues.value = []
  submitError.value = undefined

  const payload = behavior.visibleDraft.value as Record<string, unknown>
  const validation = validateDraft({ schema: props.schema, draft: payload, hiddenKeys: hiddenKeys.value })
  if (!validation.success) {
    issues.value = validation.issues
    return
  }

  submitting.value = true
  try {
    const result = await props.submit(validation.data as Record<string, unknown>)
    emit('submitted', result)
  } catch (error) {
    const normalized = (props.normalizeError ?? adapters.data.normalizeError)(error)
    submitError.value = normalized
    if (normalized.issues) issues.value = normalized.issues
    emit('error', normalized)
  } finally {
    submitting.value = false
  }
}

defineExpose({ draft, reset, submit, refresh: loaded.refresh, dirty, submitting })
</script>

<template>
  <form novalidate @submit.prevent="submit">
    <slot v-if="loaded.loading.value" name="loading">
      <p role="status" aria-live="polite">Memuat…</p>
    </slot>

    <template v-else>
      <p v-if="submitError" role="alert">{{ submitError.message }}</p>

      <div v-for="field in visibleFields" :key="field.key" class="is-form-field">
        <label :for="`field-${field.key}`">{{ field.label }}</label>

        <slot
          :name="`input:${field.key}`"
          :value="draft[field.key]"
          :draft="draft"
          :field="field"
          :set-value="(value: unknown) => setValue(field.key, value)"
          :error="issueFor(field.key)"
          :touched="touched[field.key] ?? false"
          :disabled="props.disabled || behavior.state(field.key).value.disabled"
        >
          <component
            :is="renderers.require(field.renderer)"
            v-if="field.renderer"
            :id="`field-${field.key}`"
            v-bind="behavior.state(field.key).value.props"
            :value="draft[field.key]"
            :draft="draft"
            :field="field"
            :set-value="(value: unknown) => setValue(field.key, value)"
            :error="issueFor(field.key)"
            :touched="touched[field.key] ?? false"
            :disabled="props.disabled || behavior.state(field.key).value.disabled"
            :aria-invalid="issueFor(field.key) ? 'true' : undefined"
            :aria-describedby="issueFor(field.key) ? `error-${field.key}` : undefined"
          />
          <input
            v-else
            :id="`field-${field.key}`"
            :value="draft[field.key] ?? ''"
            :disabled="props.disabled || behavior.state(field.key).value.disabled"
            :aria-invalid="issueFor(field.key) ? 'true' : undefined"
            :aria-describedby="issueFor(field.key) ? `error-${field.key}` : undefined"
            @input="setValue(field.key, ($event.target as HTMLInputElement).value)"
          />
        </slot>

        <p v-if="issueFor(field.key)" :id="`error-${field.key}`" role="alert">{{ issueFor(field.key) }}</p>
      </div>

      <slot name="controls" :submit="submit" :reset="reset" :submitting="submitting" :dirty="dirty">
        <button type="submit" :disabled="props.disabled || submitting">Simpan</button>
      </slot>
    </template>
  </form>
</template>
