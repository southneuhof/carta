<script setup lang="ts">
import { computed, inject, ref, type Component, type PropType, type Ref } from 'vue'
import type { InputConfig } from '@southneuhof/is-data-model'
import BaseInput from '@southneuhof/is-vue-framework/components/inputs/BaseInput.vue'
import { commonProps } from '@southneuhof/is-vue-framework/components/inputs/commonprops'
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue'
import Card from '@southneuhof/is-vue-framework/components/base/Card.vue'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'
import { resolveInputComponent } from '@southneuhof/is-vue-framework/renderers/inputRegistry'

type InlineInputConfig = {
  type: string
  component?: Component
  props?: Record<string, any>
}

const props = defineProps({
  ...commonProps,
  textField: {
    type: String,
    required: true,
  },
  summaryPlaceholder: {
    type: String,
    default: 'Button not configured',
  },
  textLabelOverride: {
    type: String,
    default: '',
  },
  urlLabelOverride: {
    type: String,
    default: '',
  },
  urlInputConfig: {
    type: Object as PropType<InlineInputConfig>,
    default: undefined,
  },
})

const emit = defineEmits<{
  (event: 'validation:touch'): void
}>()

defineModel({ required: false })
const buttonUrl = defineModel<any>('buttonUrl')
const buttonText = defineModel<string>('buttonText')

const formInputConfig = inject<Ref<InputConfig> | null>('formInputConfig', null)
const formFieldsAlias = inject<Record<string, string>>('formFieldsAlias', {})

const isOpen = ref(false)

const resolvedUrlConfig = computed<InlineInputConfig>(() => props.urlInputConfig ?? { type: 'url' })
const resolvedTextConfig = computed<InlineInputConfig>(() => {
  const injectedConfig = formInputConfig?.value?.[props.textField]
  if (injectedConfig) return injectedConfig as InlineInputConfig
  return { type: 'text' }
})

const resolvedUrlLabel = computed(() => props.urlLabelOverride || formFieldsAlias?.[props.field] || props.label || 'Button URL')
const resolvedTextLabel = computed(() => props.textLabelOverride || formFieldsAlias?.[props.textField] || 'Button Text')

const summary = computed(() => {
  if (buttonText.value) return buttonText.value
  if (typeof buttonUrl.value === 'string' && buttonUrl.value.trim()) return buttonUrl.value
  if (buttonUrl.value != null && buttonUrl.value !== '') return String(buttonUrl.value)
  return props.summaryPlaceholder
})

function resolveRenderer(config: InlineInputConfig) {
  if (config.type === 'custom' && config.component) return config.component
  return resolveInputComponent(config.type)
}

const urlRenderer = computed(() => resolveRenderer(resolvedUrlConfig.value))
const textRenderer = computed(() => resolveRenderer(resolvedTextConfig.value))

function touchValidation() {
  emit('validation:touch')
}
</script>

<template>
  <BaseInput v-bind="props">
    <div class="flex flex-col">
      <Card
        class="w-full flex-row items-center gap-4 justify-between"
        color="surfaceContainerHigh"
        variant="outlined"
        type="button"
        :disabled="disabled"
        @click="isOpen = !isOpen"
      >
        <span class="truncate text-left">{{ summary }}</span>
        <Icon :name="isOpen ? 'arrow-up-s' : 'arrow-down-s'" />
      </Card>

      <div v-show="isOpen" class="grid gap-3 border border-outline-variant bg-transparent p-4 rounded-b-xl pt-6 -mt-2">
        <component
          :is="urlRenderer"
          v-if="urlRenderer"
          v-model="buttonUrl"
          :label="resolvedUrlLabel"
          :disabled="disabled"
          :enableHelperMessage="false"
          v-bind="resolvedUrlConfig.props"
          @validation:touch="touchValidation"
          @update:modelValue="touchValidation"
        />
        <component
          :is="textRenderer"
          v-if="textRenderer"
          v-model="buttonText"
          :label="resolvedTextLabel"
          :disabled="disabled"
          :enableHelperMessage="false"
          v-bind="resolvedTextConfig.props"
          @validation:touch="touchValidation"
          @update:modelValue="touchValidation"
        />
      </div>
    </div>
  </BaseInput>
</template>
