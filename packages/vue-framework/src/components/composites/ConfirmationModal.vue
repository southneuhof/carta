<script setup lang="ts">
import { computed, getCurrentInstance, ref, type PropType } from 'vue'
import Modal from '../base/Modal.vue'
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue'

type ButtonKind = 'button' | 'icon' | 'split'
type ButtonVariant = 'elevated' | 'filled' | 'tonal' | 'outlined' | 'text' | 'standard'
type ButtonColor = 'primary' | 'warning' | 'error' | 'info' | 'success'
type ButtonSize = 'square' | 'full'
type ButtonType = 'button' | 'submit' | 'reset'

export type ConfirmationModalActions = {
  label: string
  appearance?: {
    variant?: ButtonVariant
    kind?: ButtonKind
    color?: ButtonColor
    size?: ButtonSize
    type?: ButtonType
    disabled?: boolean
  }
  onClick: (setOpen: (open: boolean) => void) => unknown | Promise<unknown>
  onSuccess?: () => void
  onError?: (error: unknown) => void
}

const props = defineProps({
  title: {
    type: String,
    default: 'Apakah anda yakin ingin melakukan aksi ini?',
  },
  message: {
    type: String,
    default: 'Tekan lanjut untuk melanjutkan aksi',
  },
  actions: {
    type: Array as PropType<ConfirmationModalActions[]>,
    default: null,
  },
  onConfirm: {
    type: Function as PropType<(setOpen: (open: boolean) => void) => unknown | Promise<unknown>>,
    default: null,
  },
  onCancel: {
    type: Function as PropType<() => unknown | Promise<unknown>>,
    default: null,
  },
  onSuccess: {
    type: Function as PropType<() => void>,
    default: null,
  },
  onError: {
    type: Function as PropType<(error: unknown) => void>,
    default: null,
  },
  data: {
    type: Object,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const isPending = ref(false)
const instance = getCurrentInstance()

const resolvedActions = computed<ConfirmationModalActions[]>(() => {
  const isActionsPropDeclared = !!instance?.vnode.props && 'actions' in instance.vnode.props
  if (isActionsPropDeclared) return props.actions ?? []

  return [
    {
      label: 'Continue',
      appearance: {
        color: 'primary',
        variant: 'filled',
      },
      onClick: (setOpen) => (props.onConfirm ? props.onConfirm(setOpen) : setOpen(false)),
      onSuccess: props.onSuccess ?? undefined,
      onError: props.onError ?? undefined,
    },
    {
      label: 'Cancel',
      appearance: {
        color: 'error',
        variant: 'filled',
      },
      onClick: (setOpen) => {
        if (props.onCancel) return props.onCancel()
        setOpen(false)
      },
    },
  ]
})

function isPromiseLike(value: unknown): value is Promise<unknown> {
  return !!value && typeof (value as Promise<unknown>).then === 'function'
}

async function handleAction(action: ConfirmationModalActions, setOpen: (open: boolean) => void) {
  if (isPending.value) return

  try {
    const result = action.onClick(setOpen)

    if (isPromiseLike(result)) {
      isPending.value = true
      try {
        await result
        action.onSuccess?.()
        setOpen(false)
      } catch (error) {
        action.onError?.(error)
      } finally {
        isPending.value = false
      }
      return
    }

    setOpen(false)
  } catch (error) {
    console.error(error)
  }
}
</script>

<template>
  <Modal :class="[$attrs.class as string, { 'pointer-events-none': isPending }]" :disabled="disabled">
    <template #trigger="{ disabled }">
      <slot name="trigger" v-bind="{ disabled }"></slot>
    </template>
    <template #title>
      <slot name="title">{{ title }}</slot>
    </template>
    <template #icon v-if="$slots['icon']">
      <slot name="icon"></slot>
    </template>
    <template #description>
      <slot name="description">{{ message }}</slot>
    </template>
    <template #footer="{ setOpen }">
      <div class="flex w-full flex-row items-center justify-end gap-4">
        <Button v-for="(action, idx) in resolvedActions" :key="idx" :disabled="isPending || !!action.appearance?.disabled" v-bind="action.appearance" @click="handleAction(action, setOpen)">
          {{ action.label }}
        </Button>
      </div>
    </template>
  </Modal>
</template>
