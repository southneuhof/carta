<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { twMerge } from 'tailwind-merge'
import { computed, useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })

type CardVariant = 'filled' | 'elevated' | 'outlined'
type CardColorRole =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'info'
  | 'infoContainer'
  | 'warning'
  | 'warningContainer'
  | 'success'
  | 'successContainer'
  | 'error'
  | 'surface'
  | 'surfaceContainerLowest'
  | 'surfaceContainerLow'
  | 'surfaceContainer'
  | 'surfaceContainerHigh'
  | 'surfaceContainerHighest'
  | 'primaryContainer'
  | 'secondaryContainer'
  | 'tertiaryContainer'
  | 'errorContainer'

const attrs = useAttrs()

const props = withDefaults(
  defineProps<{
    variant?: CardVariant
    color?: CardColorRole
    containerRole?: CardColorRole
    disabled?: boolean
  }>(),
  {
    variant: 'filled',
    color: 'surfaceContainer',
    disabled: false,
  }
)

const isInteractive = computed(() => Boolean(attrs.onClick))

const resolvedRole = computed(
  () => props.color ?? props.containerRole ?? 'surfaceContainer'
)

const backgroundClassMap: Record<CardColorRole, string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  tertiary: 'bg-tertiary',
  info: 'bg-info',
  infoContainer: 'bg-info-container',
  warning: 'bg-warning',
  warningContainer: 'bg-warning-container',
  success: 'bg-success',
  successContainer: 'bg-success-container',
  error: 'bg-error',
  surface: 'bg-surface',
  surfaceContainerLowest: 'bg-surface-container-lowest',
  surfaceContainerLow: 'bg-surface-container-low',
  surfaceContainer: 'bg-surface-container',
  surfaceContainerHigh: 'bg-surface-container-high',
  surfaceContainerHighest: 'bg-surface-container-highest',
  primaryContainer: 'bg-primary-container',
  secondaryContainer: 'bg-secondary-container',
  tertiaryContainer: 'bg-tertiary-container',
  errorContainer: 'bg-error-container',
}

const foregroundClassMap: Record<CardColorRole, string> = {
  primary: 'text-on-primary',
  secondary: 'text-on-secondary',
  tertiary: 'text-on-tertiary',
  info: 'text-on-info',
  infoContainer: 'text-on-info-container',
  warning: 'text-on-warning',
  warningContainer: 'text-on-warning-container',
  success: 'text-on-success',
  successContainer: 'text-on-success-container',
  error: 'text-on-error',
  surface: 'text-on-surface',
  surfaceContainerLowest: 'text-on-surface',
  surfaceContainerLow: 'text-on-surface',
  surfaceContainer: 'text-on-surface',
  surfaceContainerHigh: 'text-on-surface',
  surfaceContainerHighest: 'text-on-surface',
  primaryContainer: 'text-on-primary-container',
  secondaryContainer: 'text-on-secondary-container',
  tertiaryContainer: 'text-on-tertiary-container',
  errorContainer: 'text-on-error-container',
}

const variantClassMap: Record<CardVariant, string> = {
  filled: '',
  outlined: 'border border-outline-variant',
  elevated: '',
}

const variantStyle = computed<CSSProperties>(() => {
  if (props.variant !== 'elevated') return {}
  return {
    boxShadow: '0 1px 1px rgb(var(--md-sys-color-shadow) / 0.28)',
  }
})

const mergedClass = computed(() =>
  twMerge(
    'relative flex flex-col gap-4 overflow-hidden rounded-xl p-4',
    backgroundClassMap[resolvedRole.value],
    foregroundClassMap[resolvedRole.value],
    variantClassMap[props.variant],
    isInteractive.value && !props.disabled
      ? 'overlay cursor-pointer select-none transition-none after:pointer-events-none after:block after:bg-current after:opacity-0 hover:after:opacity-[.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:after:opacity-[.12]'
      : '',
    props.disabled ? 'pointer-events-none' : '',
    attrs.class as string
  )
)

const mergedStyle = computed(() => [variantStyle.value, attrs.style])

const forwardedAttrs = computed(() => {
  const { class: _class, style: _style, onClick: _onClick, ...rest } =
    attrs as Record<string, unknown>
  return rest
})

const invokeClick = (event: Event) => {
  const onClick = attrs.onClick
  if (!onClick) return
  if (Array.isArray(onClick)) {
    onClick.forEach((handler) => {
      if (typeof handler === 'function') handler(event)
    })
    return
  }
  if (typeof onClick === 'function') onClick(event)
}

const handleRootClick = (event: MouseEvent) => {
  if (props.disabled) {
    event.preventDefault()
    event.stopPropagation()
    return
  }

  invokeClick(event)
}

const handleRootKeydown = (event: KeyboardEvent) => {
  if (!isInteractive.value || props.disabled) return

  if (event.key === 'Enter') {
    invokeClick(event)
    return
  }

  if (event.key === ' ') {
    event.preventDefault()
    invokeClick(event)
  }
}
</script>

<template>
  <div
    v-bind="forwardedAttrs"
    :role="isInteractive ? 'button' : undefined"
    :tabindex="isInteractive ? 0 : undefined"
    :aria-disabled="disabled ? 'true' : undefined"
    :class="mergedClass"
    :style="mergedStyle"
    @click="handleRootClick"
    @keydown="handleRootKeydown"
  >
    <div v-if="$slots.header"><slot name="header"></slot></div>
    <slot></slot>
    <div v-if="$slots.footer"><slot name="footer"></slot></div>
    <div
      v-if="disabled"
      class="pointer-events-none absolute inset-0 bg-on-surface/[12%]"
    />
  </div>
</template>
