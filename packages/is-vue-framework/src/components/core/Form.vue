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
import { computed, getCurrentInstance, nextTick, onUnmounted, reactive, ref, watch } from 'vue'
import type { FormProps, FormValidationTrigger, RecordLoadContext, SubmitError, ValidationIssue } from '../../contracts'
import { createBehaviorRuntime, resolveFields } from '../../fields'
import { inferFieldLayers, validateDraftAsync, validatorDefinition, validatorsForTrigger } from '../../validation'
import { useLoader } from '../../query'
import { useFrameworkAdapters } from '../../adapters/projectAdapters'
import { useRendererRegistry } from '../../renderers/registry'
import Button from '../base/Button.vue'
import { assertSingleDataSource, ownerOf, recordCacheKey } from './useCoreData'

const props = withDefaults(defineProps<FormProps>(), {
  searchParameters: () => ({}),
  disabled: false,
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: Record<string, unknown>): void
  (event: 'submitted', result: unknown): void
  (event: 'error', error: SubmitError): void
  (event: 'reset'): void
}>()

const vnodeProps = getCurrentInstance()?.vnode.props ?? {}
const hasModelValue = 'modelValue' in vnodeProps
const hasModelListener = 'onUpdate:modelValue' in vnodeProps
/** Binding presence, rather than model value, selects model-bound operation. */
const isModelBound = hasModelValue || hasModelListener
const isDevelopment = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV !== 'production'
if (isDevelopment && isModelBound && (!hasModelValue || !hasModelListener)) {
  console.warn('[is-vue-framework] Form model-bound operation needs both modelValue and onUpdate:modelValue.')
}

const adapters = useFrameworkAdapters()
const renderers = useRendererRegistry('form')

const fields = computed(() => {
  const schema = props.schema as { source?: Parameters<typeof inferFieldLayers>[0] } | undefined
  return resolveFields({ fields: props.fields, surface: 'form', schema: schema?.source ? inferFieldLayers(schema.source) : undefined })
})
const owner = ownerOf(props.namespace, 'form')

const loaded = useLoader<RecordLoadContext, Partial<Record<string, unknown>> | undefined>({
  key: computed(() => recordCacheKey(owner, undefined, props.searchParameters ?? {})),
  context: computed(() => ({ searchParameters: props.searchParameters ?? {} })),
  load: computed(() => (isModelBound ? undefined : props.load)),
})

const draft = reactive<Record<string, unknown>>({ ...(isModelBound ? props.modelValue : props.initialData ?? {}) })
const edited = reactive(new Set<string>())
const touched = reactive<Record<string, boolean>>({})
const issues = ref<ValidationIssue[]>([])
const submitError = ref<SubmitError>()
const submitting = ref(false)
const validating = ref(false)
const validatingPaths = ref(new Set<string>())
const submitAttempted = ref(false)
const modelBaseline = ref<Record<string, unknown>>({ ...(props.modelValue ?? {}) })
const initial = ref<Record<string, unknown>>({ ...(isModelBound ? props.modelValue : props.initialData ?? {}) })
const lastEmittedModel = ref<Record<string, unknown>>()
let validationController: AbortController | undefined
let validationRun = 0

function shallowEqual(left: Record<string, unknown>, right: Record<string, unknown>) {
  const leftKeys = Object.keys(left)
  return leftKeys.length === Object.keys(right).length && leftKeys.every((key) => Object.is(left[key], right[key]))
}

function replaceDraft(value: Record<string, unknown>) {
  for (const key of Object.keys(draft)) delete draft[key]
  Object.assign(draft, value)
}

function emitModel() {
  if (!isModelBound) return
  const next = { ...draft }
  lastEmittedModel.value = next
  emit('update:modelValue', next)
}

watch(
  () => props.modelValue,
  (value) => {
    if (!isModelBound) return
    const next = { ...(value ?? {}) }
    if (lastEmittedModel.value && shallowEqual(next, lastEmittedModel.value) && shallowEqual(next, draft)) return
    replaceDraft(next)
    modelBaseline.value = { ...next }
    initial.value = { ...next }
    edited.clear()
    issues.value = []
  },
  { immediate: true },
)

/** Loaded values override initial values; user edits override both. */
watch(
  () => loaded.data.value,
  (value) => {
    if (!value) return
    for (const [key, next] of Object.entries(value)) {
      if (edited.has(key)) continue
      draft[key] = next
      initial.value[key] = next
    }
  },
  { immediate: true },
)

const behavior = createBehaviorRuntime({ fields: fields.value, draft, context: props.context })
behavior.connect((key, value) => {
  draft[key] = value
  edited.delete(key)
  emitModel()
})

const hiddenKeys = computed(() => fields.value.map((field) => field.key).filter((key) => !behavior.visibleKeys.value.includes(key)))
const visibleFields = computed(() => fields.value.filter((field) => behavior.state(field.key).value.visible))
const dirty = computed(() => (isModelBound ? !shallowEqual(draft, modelBaseline.value) : edited.size > 0))
const displayedIssues = computed(() => issues.value.filter((issue) => issue.path.length === 0 || submitAttempted.value || touched[String(issue.path[0])]))
const rootIssues = computed(() => displayedIssues.value.filter((issue) => issue.path.length === 0))

function issueFor(key: string) {
  return displayedIssues.value.find((issue) => issue.path[0] === key)?.message
}

function rendererFor(key: string, fallback?: string): string | undefined {
  const renderer = behavior.state(key).value.renderer
  return renderer === undefined ? fallback : renderer ?? undefined
}

function setValue(key: string, value: unknown) {
  const field = fields.value.find((entry) => entry.key === key)
  if (field?.behavior?.derived) return
  edited.add(key)
  touched[key] = true
  if (field?.write) field.write(draft, value, {})
  else draft[key] = value
  emitModel()
}

async function validate(trigger: FormValidationTrigger = 'submit', field?: string) {
  validationController?.abort()
  const controller = new AbortController()
  validationController = controller
  const run = ++validationRun
  validating.value = true
  const paths = new Set<string>()
  for (const validator of validatorsForTrigger(props.validators ?? [], trigger)) {
    const path = validatorDefinition(validator).path?.[0]
    if (path !== undefined) paths.add(String(path))
  }
  validatingPaths.value = paths
  const payload = behavior.visibleDraft.value as Record<string, unknown>
  try {
    const validation = await validateDraftAsync({
      schema: props.schema,
      draft: payload,
      hiddenKeys: hiddenKeys.value,
      validators: props.validators,
      trigger,
      initial: initial.value,
      context: props.context ?? {},
      field,
      signal: controller.signal,
      settle: behavior.settle,
    })
    if (run === validationRun && !controller.signal.aborted) issues.value = validation.success ? [] : validation.issues
    return validation
  } finally {
    if (run === validationRun) {
      validating.value = false
      validatingPaths.value = new Set()
    }
  }
}

function touch(key: string) {
  touched[key] = true
  void validate('blur', key)
}

watch(hiddenKeys, (keys) => {
  const hidden = new Set(keys)
  issues.value = issues.value.filter((issue) => !hidden.has(String(issue.path[0])))
  for (const key of hidden) delete touched[key]
})

async function focusFirstInvalid() {
  await nextTick()
  const key = displayedIssues.value.map((issue) => String(issue.path[0])).find((entry) => entry !== 'undefined' && !hiddenKeys.value.includes(entry))
  if (!key) {
    document.getElementById('form-errors')?.focus()
    return
  }
  const element = document.getElementById(`field-${key}`)
  element?.scrollIntoView?.({ block: 'nearest' })
  element?.focus?.()
}

function reset() {
  if (isModelBound) {
    replaceDraft({ ...modelBaseline.value })
    emitModel()
  } else replaceDraft({ ...props.initialData, ...loaded.data.value })
  edited.clear()
  issues.value = []
  submitAttempted.value = false
  submitError.value = undefined
  emit('reset')
}

async function submit() {
  if (props.disabled || submitting.value || validating.value) return
  issues.value = []
  submitError.value = undefined
  submitAttempted.value = true

  const validation = await validate('submit')
  if (!validation.success) {
    await focusFirstInvalid()
    return
  }

  if (!props.submit) {
    throw new Error('[is-vue-framework] Form needs submit unless it is bound with v-model.')
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

onUnmounted(() => validationController?.abort())

defineExpose({ draft, reset, submit, refresh: loaded.refresh, dirty, submitting, validating })
</script>

<template>
  <form novalidate class="flex flex-col gap-5" @submit.prevent="submit">
    <slot v-if="loaded.loading.value" name="loading">
      <div class="rounded-lg bg-surface-container px-4 py-3 text-sm text-on-surface">
        <p role="status" aria-live="polite">Loading…</p>
      </div>
    </slot>

    <template v-else-if="loaded.error.value">
      <slot name="load-error" :error="loaded.error.value" :refresh="loaded.refresh">
        <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-error-container px-4 py-3 text-on-error-container">
          <p role="alert" class="text-sm leading-5">{{ loaded.error.value.message }}</p>
          <Button type="button" variant="text" class="min-w-0 px-4" @click="loaded.refresh">Retry</Button>
        </div>
      </slot>
    </template>

    <template v-else>
      <p v-if="submitError" role="alert" class="rounded-lg bg-error-container px-4 py-3 text-sm leading-5 text-on-error-container">{{ submitError.message }}</p>
      <div v-if="rootIssues.length" id="form-errors" tabindex="-1" role="alert" aria-live="polite" class="rounded-lg bg-error-container px-4 py-3 text-on-error-container">
        <p v-for="(issue, index) in rootIssues" :key="index" :data-operational="issue.kind === 'operational' || undefined">{{ issue.message }}</p>
      </div>

      <div class="grid grid-cols-12 gap-x-4 gap-y-5">
      <div
        v-for="field in visibleFields"
        :key="field.key"
        class="is-form-field flex min-w-0 flex-col gap-2"
        :style="{ gridColumn: `span ${Math.min(12, Math.max(1, (behavior.state(field.key).value.span === undefined ? field.span : behavior.state(field.key).value.span) ?? 12))} / span ${Math.min(12, Math.max(1, (behavior.state(field.key).value.span === undefined ? field.span : behavior.state(field.key).value.span) ?? 12))}` }"
      >
        <label :for="`field-${field.key}`" class="text-sm font-medium leading-5 text-on-surface">{{ behavior.state(field.key).value.label === undefined ? field.label : behavior.state(field.key).value.label ?? field.key }}</label>

        <slot
          :name="`input:${field.key}`"
          :value="draft[field.key]"
          :draft="draft"
          :field="field"
          :set-value="(value: unknown) => setValue(field.key, value)"
          :error="issueFor(field.key)"
          :touched="touched[field.key] ?? false"
          :disabled="props.disabled || behavior.state(field.key).value.disabled"
          :validating="validatingPaths.has(field.key)"
          :form-validating="validating"
        >
          <component
            :is="renderers.require(rendererFor(field.key, field.renderer)!)"
            v-if="rendererFor(field.key, field.renderer)"
            :key="rendererFor(field.key, field.renderer)"
            :id="`field-${field.key}`"
            v-bind="behavior.state(field.key).value.props"
            :value="draft[field.key]"
            :draft="draft"
            :field="field"
            :set-value="(value: unknown) => setValue(field.key, value)"
            :error="issueFor(field.key)"
            :touched="touched[field.key] ?? false"
            :disabled="props.disabled || behavior.state(field.key).value.disabled"
            :validating="validatingPaths.has(field.key)"
            :form-validating="validating"
            :aria-invalid="issueFor(field.key) ? 'true' : undefined"
            :aria-describedby="issueFor(field.key) ? `error-${field.key}` : undefined"
            @validation:touch="touch(field.key)"
          />
          <input
            v-else
            :id="`field-${field.key}`"
            :value="draft[field.key] ?? ''"
            :disabled="props.disabled || behavior.state(field.key).value.disabled"
            :aria-invalid="issueFor(field.key) ? 'true' : undefined"
            :aria-describedby="issueFor(field.key) ? `error-${field.key}` : undefined"
            :class="[
              'min-h-12 w-full rounded-lg bg-transparent px-4 py-3 text-on-surface outline outline-1 outline-outline/[24%] transition-[outline-color,box-shadow] duration-150 ease-out focus:outline-secondary focus:ring-1 focus:ring-secondary/30',
              issueFor(field.key) ? 'outline-error focus:outline-error focus:ring-error/30' : '',
              props.disabled || behavior.state(field.key).value.disabled ? 'cursor-not-allowed text-on-surface-variant opacity-60' : '',
            ]"
            @input="setValue(field.key, ($event.target as HTMLInputElement).value)"
            @blur="touch(field.key)"
          />
        </slot>

        <p v-if="issueFor(field.key)" :id="`error-${field.key}`" role="alert" class="text-sm leading-5 text-error">{{ issueFor(field.key) }}</p>
      </div>
      </div>

      <slot name="actions" :submit="submit" :reset="reset" :submitting="submitting" :dirty="dirty">
        <Button v-if="!isModelBound" type="submit" :disabled="props.disabled || loaded.loading.value || validating || submitting">Save</Button>
      </slot>
    </template>
  </form>
</template>
