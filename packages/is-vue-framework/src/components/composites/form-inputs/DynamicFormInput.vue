<script setup lang="ts">
import { onMounted, ref, type PropType } from 'vue'
import { missingBehavior } from '@southneuhof/is-vue-framework/adapters/behaviors'
import { useFrameworkBehaviors } from '@southneuhof/is-vue-framework'

const props = defineProps({
  templateAPI: { type: String, required: true },
  component: { type: Object as PropType<any>, required: true },
  props: { type: Object as PropType<Record<string, any>>, default: () => ({}) },
  view: { type: String, default: 'name' },
  model: { type: String, default: 'value' },
})
const behaviors = useFrameworkBehaviors()

const modelValue = defineModel<any>()
onMounted(() => {
  if (!modelValue.value) {
    const getTemplate = behaviors.dynamicForm?.getTemplate
    if (!getTemplate) missingBehavior('dynamicForm.getTemplate')
    getTemplate(props.templateAPI).then((data) => {
      modelValue.value = data
    })
  }
})
</script>

<template>
  <div v-if="modelValue" class="flex flex-col gap-8">
    <component :is="props.component" v-for="item in modelValue" :label="item[view]" v-model="item[model]" v-bind="props.props" />
  </div>
</template>
