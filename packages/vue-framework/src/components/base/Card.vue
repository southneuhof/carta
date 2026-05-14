<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { twMerge } from 'tailwind-merge'
import { computed, useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })

type CardVariant = 'filled' | 'elevated' | 'outlined'
type CardColorRole =
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
    contentPadding?: number
  }>(),
  {
    variant: 'filled',
    color: 'surfaceContainer',
    disabled: false,
    contentPadding: 16,
  }
)

const isInteractive = computed(() => Boolean(attrs.onClick))

const resolvedRole = computed(
  () => props.color ?? props.containerRole ?? 'surfaceContainer'
)

const backgroundClassMap: Record<CardColorRole, string> = {
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
    'relative flex flex-col gap-4 overflow-hidden rounded-xl',
    backgroundClassMap[resolvedRole.value],
    foregroundClassMap[resolvedRole.value],
    variantClassMap[props.variant],
    isInteractive.value && !props.disabled ? 'group cursor-pointer' : '',
    props.disabled ? 'pointer-events-none' : '',
    attrs.class as string
  )
)

const mergedStyle = computed(() => [
  { padding: `${props.contentPadding}px` } as CSSProperties,
  variantStyle.value,
  attrs.style,
])

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
      class="pointer-events-none absolute inset-0 hidden bg-on-surface/[10%]"
      :class="isInteractive && !disabled ? 'group-active:block' : ''"
    />
    <div
      v-if="disabled"
      class="pointer-events-none absolute inset-0 bg-on-surface/[12%]"
    />
  </div>
</template>
