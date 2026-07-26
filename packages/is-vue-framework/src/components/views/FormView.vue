<script setup lang="ts">
/**
 * Draft surface shell.
 *
 * Owns the Card, title, and submit/cancel chrome, wiring them through Form's
 * exposed contract. Like Form itself, it never learns whether the submission
 * creates or updates.
 */
import { ref } from 'vue'
import type { FormProps, SubmitError } from '../../contracts'
import Form from '../core/Form.vue'
import ViewControls from './ViewControls.vue'
import { controlsAt, type ViewControl } from './controls'

const props = defineProps<{
  form: FormProps
  title?: string
  description?: string
  submitLabel?: string
  controls?: readonly ViewControl[]
}>()

const emit = defineEmits<{
  (event: 'submitted', result: unknown): void
  (event: 'error', error: SubmitError): void
}>()

const instance = ref<{ submit: () => Promise<void>; reset: () => void; submitting: boolean } | null>(null)
</script>

<template>
  <section class="is-form-view">
    <header>
      <slot name="header">
        <h1 v-if="title">{{ title }}</h1>
        <p v-if="description">{{ description }}</p>
      </slot>
      <slot name="controls">
        <ViewControls :controls="controlsAt(props.controls, 'primary')" label="Kontrol utama" />
      </slot>
    </header>

    <slot name="body" v-bind="{ form: props.form }">
      <Form
        ref="instance"
        v-bind="props.form"
        @submitted="emit('submitted', $event)"
        @error="emit('error', $event)"
      >
        <template v-for="(_, name) in $slots" #[name]="slotProps" :key="name">
          <slot :name="name" v-bind="slotProps ?? {}" />
        </template>
        <template #controls>
          <slot name="form-controls" :submit="() => instance?.submit()" :reset="() => instance?.reset()">
            <div class="is-form-view-controls">
              <button type="submit" :disabled="instance?.submitting">{{ submitLabel ?? 'Simpan' }}</button>
              <button type="button" @click="instance?.reset()">Batal</button>
            </div>
          </slot>
        </template>
      </Form>
    </slot>

    <footer>
      <slot name="footer">
        <ViewControls :controls="controlsAt(props.controls, 'secondary')" label="Kontrol tambahan" />
      </slot>
    </footer>
  </section>
</template>
