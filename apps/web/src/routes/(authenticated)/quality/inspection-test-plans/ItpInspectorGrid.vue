<script setup lang="ts">
import { Card } from '@southneuhof/is-vue-framework/components/base'
import CheckboxInput from '@southneuhof/is-vue-framework/components/inputs/CheckboxInput.vue'

export type ItpInspectorGridPoint = {
  inspectionPointCode: string
  inspectionPointName?: string
  value: boolean
}

export type ItpInspectorGridEntry = {
  inspectorTypeId: string
  inspectorTypeCode?: string
  inspectorTypeName?: string
  points: ItpInspectorGridPoint[]
}

const props = withDefaults(
  defineProps<{
    modelValue: ItpInspectorGridEntry[]
    disabled?: boolean
  }>(),
  { disabled: false }
)

const emit = defineEmits<{
  (event: 'update:modelValue', value: ItpInspectorGridEntry[]): void
}>()

function toggle(inspectorTypeId: string, inspectionPointCode: string, value: boolean) {
  if (props.disabled) return
  emit(
    'update:modelValue',
    props.modelValue.map((inspector) =>
      inspector.inspectorTypeId !== inspectorTypeId
        ? { ...inspector, points: inspector.points.map((point) => ({ ...point })) }
        : {
            ...inspector,
            points: inspector.points.map((point) => (point.inspectionPointCode === inspectionPointCode ? { ...point, value } : { ...point })),
          }
    )
  )
}
</script>

<template>
  <div class="flex flex-col gap-3" data-itp-inspector-grid>
    <Card v-for="inspector in modelValue" :key="inspector.inspectorTypeId" variant="outlined" color="surfaceContainerHigh" :disabled="disabled" class="gap-3 p-4">
      <h3 class="font-medium">{{ inspector.inspectorTypeName ?? inspector.inspectorTypeCode ?? inspector.inspectorTypeId }}</h3>
      <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <CheckboxInput
          v-for="point in inspector.points"
          :key="point.inspectionPointCode"
          static
          :checked="point.value"
          :disabled="disabled"
          :label="point.inspectionPointName ?? point.inspectionPointCode"
          :on-toggle="(value: boolean) => toggle(inspector.inspectorTypeId, point.inspectionPointCode, value)"
        />
      </div>
    </Card>
  </div>
</template>
