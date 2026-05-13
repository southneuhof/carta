<script setup lang="ts">
import type { PropType } from 'vue'
import { ref } from 'vue'
import TextInput from './TextInput.vue'
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'

const props = defineProps({
  prefix: {
    type: String,
    default: '',
  },
  suffix: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: '',
  },
  constraint: {
    type: Array as PropType<Array<'number' | 'text'>>,
    default: () => ['text', 'number'],
  },
  validator: {
    type: Function as PropType<(value: string) => boolean>,
    default: () => true,
  },
  inputClass: {
    type: String,
  },
})

const modelValue = defineModel<string | number>()
const showPassword = ref<boolean>(false)
</script>

<template>
  <TextInput
    v-bind="props"
    :model-value="modelValue"
    @update:model-value="(value) => (modelValue = String(value))"
    :type="showPassword ? 'text' : 'password'"
  >
    <template #action>
      <Button variant="icon" size="square" @click="showPassword = !showPassword"><Icon :name="showPassword ? 'eye-off' : 'eye'" /></Button>
    </template>
  </TextInput>
</template>
